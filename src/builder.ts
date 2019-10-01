import path = require('path');
import { MySettings } from './settings';
import { Syms } from "./syms";
import { ProcessFacade, FsFacade } from "./utils";
import { Presenter } from "./presenter";

export class Builder {

    static buildFile(filePath: string) {
        let filePathWithoutExtension = FsFacade.removeExtension(filePath);
        let filePath_ll = `${filePathWithoutExtension}.ll`;
        let filePath_o = `${filePathWithoutExtension}.o`;
        let filePath_wasm = `${filePathWithoutExtension}.wasm`;

        let clangPath: any = MySettings.getClangPath();
        let llcPath: any = MySettings.getLlcPath();
        let wasmLdPath: any = MySettings.getWasmLdPath();
        let symsFilePath = FsFacade.createTempFile("main.syms", Syms.getMainSymsAsText());

        // clang
        ProcessFacade.executeSync(`${clangPath} -cc1 -Ofast -emit-llvm -triple=wasm32-unknown-unknown-wasm ${filePath}`);
        // llc
        ProcessFacade.executeSync(`${llcPath} -O3 -filetype=obj "${filePath_ll}" -o "${filePath_o}"`);
        // wasm-ld
        ProcessFacade.executeSync(`${wasmLdPath} --no-entry "${filePath_o}" -o "${filePath_wasm}" --strip-all -allow-undefined-file=${symsFilePath} -export=_main -export=do_balance -export=topUp -export=transfer`);

        Presenter.showInfo("Build done.");
    }
}
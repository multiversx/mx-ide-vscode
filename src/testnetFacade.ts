import { RestFacade } from "./utils";

export class TestnetFacade {
    public static async query(queryParams: any) {
        let url = `${queryParams.proxyUrl}/vm-values/${queryParams.resultType}`;

        let result = await RestFacade.post({
            url: url,
            data: {
                "scAddress": queryParams.scAddress,
                "funcName": queryParams.functionName,
                "args": queryParams.args,
            },
            eventTag: "testnet-query"
        });

        return result.data;
    }
}
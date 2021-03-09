import {assert} from "chai";
import { isLocalVersionOk } from "./utils";

describe("test compare local version with min version", () => {
    it("should return true", () => {
        let isOk = isLocalVersionOk('erdpy 1.0.2', '1.0.1')
        assert.equal(true, isOk)
    });
});
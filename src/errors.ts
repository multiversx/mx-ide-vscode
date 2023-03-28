import { Feedback } from "./feedback";

export function onTopLevelError(error: any) {
    Feedback.error(error, ["default"]);
}

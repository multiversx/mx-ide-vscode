import { Feedback } from "./feedback";

export function caughtTopLevel(error: any) {
    Feedback.error(error, ["default"]);
}

import { Feedback } from "./feedback";

/**
 * This function should be called when a top-level error occurs.
 * Examples of top-level errors are:
 * - errors that occur as a result of a executing a command of the extension
 * - errors that occur on a call initiated by VSCode's view rendering logic (e.g. errors when preparing data for tree views).
 */
export async function onTopLevelError(error: any): Promise<void> {
    await Feedback.error({
        message: error.message,
        error: error,
        display: true
    });
}

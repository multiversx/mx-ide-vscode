import { Presenter } from "./presenter";

export function asyncErrorCatcher(error: any) {
    Presenter.showError(error.message);
    throw error;
}
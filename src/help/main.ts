import { provideVSCodeDesignSystem, vsCodeBadge, vsCodeButton, vsCodeCheckbox, vsCodeDivider, vsCodeDropdown, vsCodeLink, vsCodeOption, vsCodePanels, vsCodeProgressRing, vsCodeRadio, vsCodeRadioGroup, vsCodeTag, vsCodeTextArea, vsCodeTextField } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(
    vsCodeBadge(),
    vsCodeButton(),
    vsCodeCheckbox(),
    vsCodeDivider(),
    vsCodeDropdown(),
    vsCodeLink(),
    vsCodeOption(),
    vsCodePanels(),
    vsCodeProgressRing(),
    vsCodeRadio(),
    vsCodeRadioGroup(),
    vsCodeTag(),
    vsCodeTextArea(),
    vsCodeTextField()
);

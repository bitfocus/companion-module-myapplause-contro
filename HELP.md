## Welcome to MyApplause Companion!

This module is used to control MyApplause Panoramas. The MyApplause Panorama is a web app that visualizes [MyApplause.app](https://MyApplause.app) user interactions of a specific hybrid or online event. E.g. it can be used to create stream overlays and social walls on stage. This module can also change the user interface of the app for that event in real-time.

The module includes over 65 preset buttons with icons or just text. Click on **`Presets`** and then e.g. on **`QuickStart (Icon)`**.

For more information check out [https://MyApplause.app](https://MyApplause.app) and feel free to contact us at [companion@myapplause.app](mailto:companion@myapplause.app) or call [+49-69-506075085](tel:+49-69-506075085).

For an instance to work you need to enter a **`MyApplause Control URL`** (which you get from the MyApplause team).

If the instance status is **`ERROR`** then probably the Panorama you want to control is not open in a browser.

> The Panorama has to be open so that feedback can be provided and the the background color of buttons can be set. The default are:
> green=Active/ON, blue=INACTIVE/OFF, pink=ERROR

Buttons that set an area take 4 parameters: x_start, y_start, x_end, y_end. Counting starts in the top left corner and takes values from 1 to 101. This means:

- fullscreen is 1,1,101,101
- top left quadrant is 1,1,51,51

> **Note:** If a button press results in an error (e.g. because it has invalid parameters), all MyApplause buttons become pink. -> press any correctly working MyApplause button to acknowledge and set all colors correctly again.

-> When you customize buttons make sure to put the **same parameters** in action and **feedback**!

-> If a button doesn't work, recreate it from Presets.

If something is not working as expected: **`DISABLE` and `ENABLE`** the MyApplause instance. This solves 99% of problems.

General Companion advice - if nothing else helps, then

1. Click on `Import/Export` and export your full configuration
2. Stop Companion
3. Delete the `~/Library/Application\ Support/companion/` folder
4. Restart Companion
5. Carefully import (pages of) your exported configuration
6. Do not hesitate to contact us :-)

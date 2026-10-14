import { showMainMenu } from './insert-ui';

export default function registerMenuCommand(): void {
  GM_registerMenuCommand('打开 GPTK 窗口', function () {
    showMainMenu();
  });
}

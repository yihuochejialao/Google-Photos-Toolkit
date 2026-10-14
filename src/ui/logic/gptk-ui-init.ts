import { insertUi } from './insert-ui';
import { updateUI } from './update-state';
import log from './log';
import getFromStorage from '../../utils/getFromStorage';
import { addAlbums } from './album-selects-update';
import { actionsListenersSetUp } from './action-bar';
import { albumSelectsControlsSetUp } from './album-selects-controls';
import controlButtonsListeners from './main-control-buttons';
import advancedSettingsListenersSetUp from './advanced-settings';
import filterListenersSetUp from './filter-listeners';
import registerMenuCommand from './register-menu-command';
import type { Album } from '../../types';

export default function initUI(): void {
  registerMenuCommand();
  insertUi();
  actionsListenersSetUp();
  filterListenersSetUp();
  controlButtonsListeners();
  albumSelectsControlsSetUp();
  advancedSettingsListenersSetUp();
  updateUI();

  const cachedAlbums = getFromStorage<Album[]>('albums');
  if (cachedAlbums) {
    log('已恢复缓存的相册列表');
    addAlbums(cachedAlbums);
  }

  window.addEventListener('beforeunload', function (e: BeforeUnloadEvent) {
    if (unsafeWindow.gptkCore.isProcessRunning) {
      e.preventDefault();
    }
  });
}

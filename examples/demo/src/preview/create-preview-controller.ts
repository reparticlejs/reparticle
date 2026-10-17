import type { ParticlePreview } from '../types/preview';
import type { PreviewController, PreviewControllerEvents } from '../types/preview-controller';

export function createPreviewController(events: PreviewControllerEvents): PreviewController {
  let runtime: ParticlePreview | null = null;

  function run(command: (preview: ParticlePreview) => void) {
    if (!runtime) {
      return;
    }
    try {
      command(runtime);
      events.onError('');
    } catch (cause) {
      events.onError(String(cause));
    }
  }

  return {
    attach(preview) {
      runtime = preview;
      events.onChange(preview.controls);
      events.onError('');
      return () => {
        if (runtime === preview) {
          runtime = null;
        }
      };
    },
    update(patch) {
      run((preview) => events.onChange(preview.update(patch)));
    },
    reset() {
      run((preview) => preview.reset());
    },
    movePointer(x, y) {
      run((preview) => preview.movePointer(x, y));
    },
    reportError(message) {
      events.onError(message);
    },
  };
}

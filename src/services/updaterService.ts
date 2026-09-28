import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/**
 * Checks whether the current runtime environment is inside the Tauri desktop application.
 */
export function isTauriApp(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

let pendingUpdate: Update | null = null;

export interface CheckUpdateResult {
  isDesktop: boolean;
  updateFound: boolean;
  version?: string;
  body?: string;
  date?: string;
  error?: string;
}

/**
 * Checks for updates using the Tauri v2 Updater plugin against GitHub Releases.
 * Safely handles both desktop and web-preview environments.
 */
export async function checkForAppUpdates(silent: boolean = false): Promise<CheckUpdateResult> {
  if (!isTauriApp()) {
    if (!silent) {
      console.log("[ZQP Updater] Web-Modus aktiv - Auto-Updates nur in der installierten Desktop-App verfügbar.");
    }
    return { isDesktop: false, updateFound: false };
  }

  try {
    const update = await check();
    if (!update) {
      if (!silent) {
        console.log("[ZQP Updater] Keine neuen Updates verfügbar. App ist auf dem aktuellen Stand.");
      }
      pendingUpdate = null;
      return { isDesktop: true, updateFound: false };
    }

    pendingUpdate = update;
    console.log(`[ZQP Updater] Neues Update gefunden: Version ${update.version}`);
    return {
      isDesktop: true,
      updateFound: true,
      version: update.version,
      body: update.body,
      date: update.date,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (!silent) {
      console.warn("[ZQP Updater] Update-Prüfung fehlgeschlagen:", errorMsg);
    }
    return { isDesktop: true, updateFound: false, error: errorMsg };
  }
}

/**
 * Downloads and installs the pending or latest available update, then relaunches the app.
 */
export async function installAppUpdate(
  onProgress?: (downloaded: number, total: number) => void
): Promise<{ success: boolean; error?: string }> {
  if (!isTauriApp()) {
    return {
      success: false,
      error: "Auto-Update ist nur in der installierten Desktop-App (.exe) verfügbar.",
    };
  }

  try {
    const update = pendingUpdate || (await check());
    if (!update) {
      return { success: false, error: "Kein Update verfügbar zum Installieren." };
    }

    let downloaded = 0;
    let contentLength = 0;

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength || 0;
          console.log(`[ZQP Updater] Download gestartet (${contentLength} Bytes)`);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          if (onProgress) {
            onProgress(downloaded, contentLength);
          }
          break;
        case "Finished":
          console.log("[ZQP Updater] Download abgeschlossen. Führe Installation durch...");
          break;
      }
    });

    console.log("[ZQP Updater] Update erfolgreich installiert. Starte App neu...");
    await relaunch();
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[ZQP Updater] Installationsfehler:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

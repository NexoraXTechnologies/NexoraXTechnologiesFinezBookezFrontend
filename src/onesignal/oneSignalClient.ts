import * as OneSignal from "react-onesignal";

let initialized = false;

export async function initOneSignal(userId = null) {
  try {
    if (!initialized) {
      // @ts-ignore
      await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false },
      });

      initialized = true;
      console.log("[OneSignal] ✅ Initialized successfully");

      // Wait until Notifications API is ready
      const waitForReady = async (tries = 10) => {
        // @ts-ignore
        while (!OneSignal?.Notifications && tries > 0) {
          console.log("[OneSignal] Waiting for Notifications API...");
          await new Promise((res) => setTimeout(res, 300));
          tries--;
        }
      };
      await waitForReady();
      // @ts-ignore
      if (OneSignal?.Notifications) {
        // @ts-ignore
        const permission = await OneSignal.Notifications.requestPermission();
        console.log("[OneSignal] Permission:", permission);

        /* ----------------------------------------------------
           ✔ FIXED foreground notification handler
           (no preventDefault, no getNotification)
        ---------------------------------------------------- */
        // @ts-ignore
        OneSignal.Notifications.addEventListener(
          "foregroundWillDisplay",
          (event: any) => {
            const notification = event.notification; // correct v16 API

            console.log("[OneSignal] Foreground notification:", notification);

            // 👉 Send to React Navbars (Dashboard + Professional)
            window.dispatchEvent(
              new CustomEvent("onesignal-notification", {
                detail: notification,
              })
            );
          }
        );
        // @ts-ignore
        OneSignal.Notifications.addEventListener("click", (event) => {
          const url = event.notification?.additionalData?.url;
          if (url) window.open(url, "_blank");
        });
        // @ts-ignore
        OneSignal.User.PushSubscription.addEventListener("change", (sub) => {
          console.log("[OneSignal] Subscription changed:", sub);
        });
      } else {
        console.warn(
          "[OneSignal] ⚠️ Notifications API not ready after waiting."
        );
      }
    }

    /* ----------------------------------------------------
       ✔ FIXED login/logout API
    ---------------------------------------------------- */
    if (userId) {
      // @ts-ignore
      await OneSignal.login(userId);
    } else {
      // @ts-ignore
      await OneSignal.User.logout(); // correct for v16
    }
  } catch (error) {
    console.error("[OneSignal] ❌ Error during init:", error);
  }
}
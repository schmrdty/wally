import { useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

export function useFarcasterEvents() {
  useEffect(() => {
    function handleFrameAdded(event) {
      // update UI or state
      console.log("Mini App was added!", event);
    }
    function handleFrameRemoved(event) {
      // update UI or state
      console.log("Mini App was removed!", event);
    }
    function handleNotificationsEnabled() {
      // update UI or state
      console.log("Notifications enabled!");
    }
    function handleNotificationsDisabled() {
      // update UI or state
      console.log("Notifications disabled!");
    }

    sdk.on('frameAdded', handleFrameAdded);
    sdk.on('frameRemoved', handleFrameRemoved);
    sdk.on('notificationsEnabled', handleNotificationsEnabled);
    sdk.on('notificationsDisabled', handleNotificationsDisabled);

    // Cleanup listeners on unmount
    return () => {
      sdk.removeListener('frameAdded', handleFrameAdded);
      sdk.removeListener('frameRemoved', handleFrameRemoved);
      sdk.removeListener('notificationsEnabled', handleNotificationsEnabled);
      sdk.removeListener('notificationsDisabled', handleNotificationsDisabled);
    };
  }, []);
}
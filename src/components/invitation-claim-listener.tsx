"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, claimStoreInvitation, subscribeToStoreInvitation } from "@/src/lib/services/auth_service";

export default function InvitationClaimListener() {
  useEffect(() => {
    let unsubscribeInvitation = () => {};
    const inFlight = new Set<string>();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeInvitation();
      unsubscribeInvitation = () => {};
      if (!user?.email) return;

      unsubscribeInvitation = subscribeToStoreInvitation(user, (hasInvitation) => {
        if (!hasInvitation || inFlight.has(user.uid)) return;
        inFlight.add(user.uid);
        void claimStoreInvitation(user).catch((error: unknown) => {
          console.error("Could not claim the store invitation.", error);
        }).finally(() => inFlight.delete(user.uid));
      }, (error) => {
        console.error("Could not listen for a store invitation.", error);
      });
    });

    return () => { unsubscribeInvitation(); unsubscribeAuth(); };
  }, []);

  return null;
}

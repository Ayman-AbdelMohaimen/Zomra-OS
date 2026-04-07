import React, { useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { get } from '../lib/db';
import { useZomraStore } from '../store/useZomraStore';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    setDirectoryHandle, 
    setUser, 
    setIsAuthReady, 
    setSkills, 
    setSkillPulse,
    directoryHandle 
  } = useZomraStore();

  useEffect(() => {
    const loadHandle = async () => {
      try {
        const handle = await get('directoryHandle');
        if (handle) {
          setDirectoryHandle(handle);
        }
      } catch (e) {
        console.error("Failed to load directory handle from IDB", e);
      }
    };
    loadHandle();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [setDirectoryHandle, setUser, setIsAuthReady]);

  // Load skills when directory is opened
  useEffect(() => {
    if (directoryHandle) {
      loadSkills();
    }
  }, [directoryHandle, setSkills, setSkillPulse]);

  const loadSkills = async () => {
    try {
      // Verify permission before trying to read
      if (directoryHandle.queryPermission) {
        const perm = await directoryHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          const req = await directoryHandle.requestPermission({ mode: 'readwrite' });
          if (req !== 'granted') return;
        }
      }

      setSkillPulse('reading');
      const fileHandle = await directoryHandle.getFileHandle('.zomra_skills.json', { create: true });
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (text) {
        setSkills(JSON.parse(text));
      } else {
        setSkills([]);
      }
    } catch (e) {
      console.error("Error loading skills", e);
    } finally {
      setSkillPulse('idle');
    }
  };

  return <>{children}</>;
};

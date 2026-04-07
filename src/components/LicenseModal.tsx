import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Key, CheckCircle, Lock } from 'lucide-react';
import { useZomraStore } from '../store/useZomraStore';

export default function LicenseModal() {
  const { isLicensed, setIsLicensed, language, isLicenseEnforced } = useZomraStore();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isRtl = language === 'AR';

  if (!isLicenseEnforced || isLicensed) return null;

  const handleVerify = () => {
    if (!key.trim()) {
      setError(isRtl ? 'يرجى إدخال مفتاح الترخيص' : 'Please enter a license key');
      return;
    }

    // Simple license verification logic - in a real app this would be server-side
    const isValid = key.startsWith('ZOMRA-');
    if (isValid) {
      setIsLicensed(true);
      setSuccess(true);
      setError('');
    } else {
      setError(isRtl ? 'مفتاح الترخيص غير صالح أو منتهي الصلاحية' : 'Invalid or expired license key');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-deep-black/90 backdrop-blur-xl flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-deep-black border border-power-red/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(206,17,38,0.15)] relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-power-red/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-power-red/10 rounded-full flex items-center justify-center mb-6 border border-power-red/30">
            {success ? (
              <CheckCircle className="text-eagle-gold w-8 h-8" />
            ) : (
              <Lock className="text-power-red w-8 h-8" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-crisp-white mb-2 tracking-tight">
            {isRtl ? 'ترخيص ZOMRA OS' : 'ZOMRA OS LICENSE'}
          </h2>
          <p className="text-sm text-crisp-white/60 mb-8">
            {isRtl 
              ? 'هذا النظام محمي بحقوق الملكية الفكرية للمهندس أيمن عبد المهيمن. يرجى إدخال مفتاح الترخيص المعتمد للمتابعة.' 
              : 'This system is protected by the intellectual property rights of Ayman AbdelMohaimen. Please enter your authorized license key to continue.'}
          </p>

          {!success ? (
            <div className="w-full space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 start-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-crisp-white/40 ms-3" />
                </div>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="ZOMRA-XXXX-XXXX"
                  className="block w-full ps-10 pe-3 py-3 border border-crisp-white/10 rounded-xl leading-5 bg-deep-black/50 text-crisp-white placeholder-crisp-white/30 focus:outline-none focus:ring-2 focus:ring-power-red focus:border-power-red sm:text-sm font-mono tracking-widest transition-all"
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-power-red text-xs font-bold flex items-center justify-center gap-1"
                >
                  <ShieldAlert size={14} /> {error}
                </motion.p>
              )}

              <button
                onClick={handleVerify}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-power-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-power-red focus:ring-offset-deep-black transition-colors"
              >
                {isRtl ? 'التحقق من الترخيص' : 'Verify License'}
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <div className="bg-eagle-gold/10 border border-eagle-gold/30 rounded-xl p-4 mb-6">
                <p className="text-eagle-gold text-sm font-bold">
                  {isRtl ? 'تم التحقق بنجاح! جاري تهيئة النظام...' : 'Verification successful! Initializing system...'}
                </p>
              </div>
            </motion.div>
          )}

          <div className="mt-8 text-[10px] text-crisp-white/30 font-mono">
            Architected & Made with ❤️ by Ayman AbdelMohaimen | 100MillionDEV.com Copyright
          </div>
        </div>
      </motion.div>
    </div>
  );
}

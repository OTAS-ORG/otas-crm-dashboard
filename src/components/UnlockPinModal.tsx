import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, ShieldAlert, Key } from 'lucide-react';
import { passwordService } from '../services/api';

interface UnlockPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

const UnlockPinModal: React.FC<UnlockPinModalProps> = ({ isOpen, onClose, onVerified }) => {
  const [mode, setMode] = useState<'unlock' | 'setup'>('unlock');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setCurrentPassword('');
      setError('');
      setMode('unlock');
      setChecking(true);
      checkPinExists();
    }
  }, [isOpen]);

  const checkPinExists = async () => {
    try {
      await passwordService.verifyVaultPin('');
    } catch (err: any) {
      if (err.response?.data?.message?.includes('No vault PIN set')) {
        setMode('setup');
      }
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await passwordService.verifyVaultPin(pin);
      if (result.success) {
        setPin('');
        onVerified();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('No vault PIN set')) {
        setMode('setup');
        setError('');
      } else {
        setError(msg || 'Incorrect PIN');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await passwordService.setVaultPin(pin, currentPassword);
      if (result.success) {
        setPin('');
        setConfirmPin('');
        setCurrentPassword('');
        onVerified();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${mode === 'setup' ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
            {mode === 'setup' ? <Key className="w-7 h-7 text-emerald-600" /> : <Lock className="w-7 h-7 text-indigo-600" />}
          </div>
          {mode === 'setup' ? (
            <>
              <h3 className="text-lg font-bold text-slate-900">Set Vault PIN</h3>
              <p className="text-sm text-slate-500 mt-1">Create a PIN to secure client passwords</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-slate-900">Unlock Password Vault</h3>
              <p className="text-sm text-slate-500 mt-1">Enter your vault PIN to view passwords</p>
            </>
          )}
        </div>

        {mode === 'setup' ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="New vault PIN"
                className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                autoFocus
                maxLength={20}
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm vault PIN"
                className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                maxLength={20}
              />
              <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading || !pin || !confirmPin} className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm">
              {loading ? 'Setting PIN...' : 'Set PIN & Unlock'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter vault PIN"
                className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                autoFocus
                maxLength={20}
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading || !pin} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm">
              {loading ? 'Verifying...' : 'Unlock'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UnlockPinModal;

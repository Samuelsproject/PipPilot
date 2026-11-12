import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, Copy, Check, ChevronDown, ChevronUp, Key } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const SupabaseConfigBanner: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (isSupabaseConfigured) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <aside aria-label="Supabase setup instructions" className="bg-[#152B30] border-b border-[#E69A36]/40 px-4 py-3 text-xs text-[#E8F2EE]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#E69A36]/20 text-[#E69A36] shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#E69A36]">Supabase Configuration Required:</span>{' '}
            <span className="text-[#A9BEB5]">
              Authentication uses real Supabase endpoints. Please configure your environment variables to enable live signup, verification, and login.
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1 shrink-0 self-end md:self-auto"
        >
          <span>{expanded ? 'Hide Setup Guide' : 'View Supabase Setup Guide'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-4 p-4 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#E8F2EE]">Connecting Supabase to PipPilotAi:</h4>
            <p className="text-xs text-[#A9BEB5]">
              Follow these steps in your Supabase dashboard to enable live email registration, verification links, and password recovery:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#152B30] border border-[#1A363E] space-y-2">
              <span className="font-mono text-[#16A36A] font-bold block">1. Obtain Project Credentials</span>
              <p className="text-[#A9BEB5]">
                In Supabase, open <strong>Project Settings → API</strong>. Copy your <strong>Project URL</strong> and <strong>anon public key</strong>.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#152B30] border border-[#1A363E] space-y-2">
              <span className="font-mono text-[#168BFF] font-bold block">2. Configure Redirect URLs</span>
              <p className="text-[#A9BEB5]">
                In <strong>Authentication → URL Configuration</strong>, set Site URL and add Redirect URLs:
              </p>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#101B20] font-mono text-[10px] text-[#E8F2EE]">
                <span className="truncate">{currentOrigin}/**</span>
                <button
                  onClick={() => copyToClipboard(`${currentOrigin}/**`, 'redirect')}
                  className="p-1 hover:text-[#16A36A]"
                  title="Copy redirect pattern"
                >
                  {copied === 'redirect' ? <Check className="w-3.5 h-3.5 text-[#16A36A]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#152B30] border border-[#1A363E] space-y-2">
              <span className="font-mono text-[#9560E8] font-bold block">3. Add Frontend Env Vars</span>
              <p className="text-[#A9BEB5]">
                Add to your environment secrets or <code>.env</code> file:
              </p>
              <code className="block p-1.5 rounded bg-[#101B20] font-mono text-[10px] text-[#16A36A]">
                VITE_SUPABASE_URL=...<br />
                VITE_SUPABASE_ANON_KEY=...
              </code>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

import React from 'react';
import { Plus, Mic, ArrowUp } from 'lucide-react-native';

export const PlusIcon = ({ color = '#0A0D12' }) => (
  <Plus size={18} color={color} />
);

export const MicIcon = ({ color = '#0A0D12' }) => (
  <Mic size={18} color={color} />
);

export const ArrowUpIcon = ({ color = 'white' }) => (
  <ArrowUp size={18} color={color} />
);
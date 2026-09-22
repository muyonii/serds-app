import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useUserSettings } from '../lib/userSettings';

interface SignUpProps {
  onNavigate: (screen: 'login' | 'main') => void;
}

type AccountType = 'citizen' | 'dispatcher';

export default function SignUp({ onNavigate }: SignUpProps) {
  const { updateProfile } = useUserSettings();
  const [accountType, setAccountType] = useState<AccountType>('citizen');

  // Shared Account Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Citizen Medical Profile (Page 20)
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [allergies, setAllergies] = useState('');

  // Dispatcher Details (Page 21)
  const [agency, setAgency] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || (accountType === 'citizen' ? 'Barry' : 'Dispatcher');

    if (accountType === 'citizen') {
      updateProfile({
        fullName: fullName.trim() || 'Barry Allen',
        displayName: firstName,
        email: email.trim(),
        bloodType: bloodType.trim() || 'ORh-',
        birthdate: dob.trim() || '1994-04-01',
        heightCm: parseInt(height.trim()) || 182,
        weightKg: parseInt(weight.trim()) || 72,
        allergies: allergies.trim() 
          ? allergies.split(',').map((a, i) => ({ id: `all-${i}`, allergen: a.trim(), reaction: 'Monitored', severity: 'Mild' }))
          : [{ id: '1', allergen: 'Grape', reaction: 'Itchy Body', severity: 'Mild' }, { id: '2', allergen: 'Apple', reaction: 'Throat Burn', severity: 'Moderate' }]
      });
    } else {
      updateProfile({
        fullName: fullName.trim() || 'Ingredia Nutrisha',
        displayName: firstName,
        email: email.trim(),
      });
    }

    onNavigate('main');
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-y-auto">
      {/* Back Button */}
      <div className="pt-8 px-6 pb-2 shrink-0">
        <button 
          onClick={() => onNavigate('login')}
          className="p-1 -ml-1 text-gray-700 hover:text-gray-900 rounded-full transition-colors"
          aria-label="Back to Login"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 px-8 pb-12 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6 tracking-tight">
          Create Account
        </h1>

        {/* Segmented Toggle Pills: Citizen vs Dispatcher */}
        <div className="grid grid-cols-2 w-full max-w-[260px] p-1 bg-gray-100 rounded-full mb-8">
          <button
            type="button"
            onClick={() => setAccountType('citizen')}
            className={`py-2 text-xs font-semibold rounded-full transition-all text-center ${
              accountType === 'citizen'
                ? 'bg-[#B41A46] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => setAccountType('dispatcher')}
            className={`py-2 text-xs font-semibold rounded-full transition-all text-center ${
              accountType === 'dispatcher'
                ? 'bg-[#B41A46] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dispatcher
          </button>
        </div>

        {/* Form Formatted Exactly According to Paper Pages 20 & 21 */}
        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          {/* Full Name */}
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
              required
            />
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
              required
            />
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
              required
            />
          </div>

          {/* CITIZEN FORM (Page 20 UI Design) */}
          {accountType === 'citizen' && (
            <div className="pt-2 space-y-3.5">
              <p className="text-xs text-gray-500 font-medium px-1">
                Medical Profile
              </p>

              {/* Date of Birth */}
              <div>
                <input
                  type="text"
                  placeholder="Date of Birth (MM/DD/YYYY)"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
                />
              </div>

              {/* Blood Type & Weight (kg) Side-by-Side */}
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Blood Type"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
                />
                <input
                  type="text"
                  placeholder="Weight (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
                />
              </div>

              {/* Height (cm) & Allergies Side-by-Side */}
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Height (cm)"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
                />
                <input
                  type="text"
                  placeholder="Allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
                />
              </div>
            </div>
          )}

          {/* DISPATCHER FORM (Page 21 UI Design) */}
          {accountType === 'dispatcher' && (
            <div className="pt-2 space-y-3.5">
              <p className="text-xs text-gray-500 font-medium px-1">
                Dispatcher Details
              </p>

              {/* Agency / Company */}
              <div>
                <input
                  type="text"
                  placeholder="Agency / Company"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
                />
              </div>

              {/* Role / Position */}
              <div>
                <input
                  type="text"
                  placeholder="Role / Position (e.g. Paramedic)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#B41A46] transition-colors"
                />
              </div>
            </div>
          )}

          {/* SIGN UP Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#B41A46] text-white rounded-xl font-medium text-xs tracking-wider uppercase hover:bg-[#9a143a] active:scale-[0.99] transition-all shadow-xs"
            >
              SIGN UP
            </button>
          </div>
        </form>

        {/* Already have an account? Log in */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#B41A46] font-semibold hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { clientService } from '../services/api';
import type { EmailPair } from '../types';

interface BusinessEmailFormProps {
  clientId: string;
  onSuccess: () => void;
  isPublic?: boolean;
}

const BusinessEmailForm: React.FC<BusinessEmailFormProps> = ({ clientId, onSuccess, isPublic = false }) => {
  const [contactPersonName, setContactPersonName] = useState('');
  const [position, setPosition] = useState('');
  const [emails, setEmails] = useState<EmailPair[]>(
    Array(5).fill({ email: '', password: '' })
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailChange = (index: number, field: keyof EmailPair, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = { ...newEmails[index], [field]: value };
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        clientId,
        formType: 'business_email',
        submittedBy: {
          name: contactPersonName,
          position: position
        },
        formData: { emails }
      };

      if (isPublic) {
        await clientService.submitPublicForm(payload);
      } else {
        await clientService.submitForm(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Business Email Submission</h2>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-medium">Email Accounts (Provide exactly 5)</p>
          {emails.map((pair, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded border border-gray-200">
              <div>
                <label className="block text-xs text-gray-500">Email Address {index + 1}</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm"
                  value={pair.email}
                  onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Password {index + 1}</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm"
                  value={pair.password}
                  onChange={(e) => handleEmailChange(index, 'password', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition"
        >
          {loading ? 'Submitting...' : 'Submit Form'}
        </button>
      </form>
    </div>
  );
};

export default BusinessEmailForm;

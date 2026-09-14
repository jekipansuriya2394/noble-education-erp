import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from './AuthContext';

interface School {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
}

interface TenantContextType {
  schools: School[];
  branches: Branch[];
  activeSchool: School | null;
  activeBranch: Branch | null;
  selectSchool: (school: School | null) => void;
  selectBranch: (branch: Branch | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const [schRes, brRes] = await Promise.all([
          apiRequest('/org/schools'),
          apiRequest('/org/branches'),
        ]);

        if (schRes.success && schRes.schools) {
          setSchools(schRes.schools);
          // Set user assigned school by default or first school
          if (user?.school) {
            const match = schRes.schools.find((s: School) => s.id === user.school?.id);
            setActiveSchool(match || schRes.schools[0]);
          } else if (schRes.schools.length > 0) {
            setActiveSchool(schRes.schools[0]);
          }
        }

        if (brRes.success && brRes.branches) {
          setBranches(brRes.branches);
          if (user?.branch) {
            const match = brRes.branches.find((b: Branch) => b.id === user.branch?.id);
            setActiveBranch(match || brRes.branches[0]);
          } else if (brRes.branches.length > 0) {
            setActiveBranch(brRes.branches[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load schools & branches:', err);
      }
    };

    fetchTenantData();
  }, [user]);

  return (
    <TenantContext.Provider
      value={{
        schools,
        branches,
        activeSchool,
        activeBranch,
        selectSchool: setActiveSchool,
        selectBranch: setActiveBranch,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

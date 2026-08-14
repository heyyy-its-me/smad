'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/testing/Sidebar';
import TopBar from '@/components/testing/TopBar';

interface CompanyProfile {
  id: string;
  company_name: string;
  product_name: string;
  positioning: string;
  differentiator: string;
  core_problem: string;
  buyer_pain: string;
  target_segment: string;
  confidence_score: number;
  icp_data: Record<string, number | string> | null;
  gtm_strategy: Record<string, unknown> | null;
  buyer_persona: Record<string, string[] | unknown> | null;
  created_at: string;
  updated_at: string;
}

export default function ProspectsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/icp/profile');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f0f23' }}>
      <Sidebar sidebarView="studio" onSidebarChange={() => {}} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            color: '#f3f4f6',
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: '24px', fontSize: '28px', fontWeight: 700 }}>
            Company Profile & Prospects
          </h1>

          {loading && <p style={{ color: '#9ca3af' }}>Loading profile...</p>}

          {error && (
            <div style={{ color: '#fca5a5', background: 'rgba(252, 165, 165, 0.1)', padding: '12px 16px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          {!profile && !loading && (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '48px 24px' }}>
              <p>No company profile found. Run the ICP strategy analysis to get started.</p>
            </div>
          )}

          {profile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Company Overview */}
              <div
                style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(200, 200, 200, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  Company Overview
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Company Name</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>{profile.company_name}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Product Name</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>{profile.product_name}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Confidence Score</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
                      {(profile.confidence_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Target Segment</p>
                    <p style={{ margin: 0, fontSize: '14px' }}>{profile.target_segment}</p>
                  </div>
                </div>
              </div>

              {/* Positioning & Differentiator */}
              <div
                style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(200, 200, 200, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  Market Position
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Positioning</p>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{profile.positioning}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Key Differentiator</p>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{profile.differentiator}</p>
                  </div>
                </div>
              </div>

              {/* Core Problem & Buyer Pain */}
              <div
                style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(200, 200, 200, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  gridColumn: '1 / -1',
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  Problem Statement
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                      CORE PROBLEM
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{profile.core_problem}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                      BUYER PAIN
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{profile.buyer_pain}</p>
                  </div>
                </div>
              </div>

              {/* ICP Data */}
              {profile.icp_data && typeof profile.icp_data === 'object' && (
                <div
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(200, 200, 200, 0.2)',
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                    Primary ICP Score
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Overall Score</p>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                        {(profile.icp_data as Record<string, unknown>).score?.toString() || 'N/A'}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Pain Severity</p>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                        {(profile.icp_data as Record<string, unknown>).pain_severity}/10
                      </p>
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Market Size</p>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                        {(profile.icp_data as Record<string, unknown>).market_size}/10
                      </p>
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Ease of Sales</p>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                        {(profile.icp_data as Record<string, unknown>).ease_of_sales}/10
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* GTM Strategy */}
              {profile.gtm_strategy && typeof profile.gtm_strategy === 'object' && (
                <div
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(200, 200, 200, 0.2)',
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                    GTM Strategy
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                        TARGET REGIONS
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Array.isArray((profile.gtm_strategy as Record<string, unknown>).target_regions)
                          ? ((profile.gtm_strategy as Record<string, unknown>).target_regions as string[]).map((region, i) => (
                              <span
                                key={i}
                                style={{
                                  background: 'rgba(200, 200, 200, 0.1)',
                                  border: '1px solid rgba(200, 200, 200, 0.3)',
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  fontSize: '12px',
                                }}
                              >
                                {region}
                              </span>
                            ))
                          : null}
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                        RECOMMENDED CHANNELS
                      </p>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        {Array.isArray((profile.gtm_strategy as Record<string, unknown>).recommended_channels)
                          ? ((profile.gtm_strategy as Record<string, unknown>).recommended_channels as string[]).map((channel, i) => (
                              <li key={i} style={{ fontSize: '14px' }}>
                                {channel}
                              </li>
                            ))
                          : null}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Persona */}
              {profile.buyer_persona && typeof profile.buyer_persona === 'object' && (
                <div
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(200, 200, 200, 0.2)',
                    borderRadius: '12px',
                    padding: '20px',
                    gridColumn: '1 / -1',
                  }}
                >
                  <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                    Buyer Persona
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                        KEY ROLES
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Array.isArray((profile.buyer_persona as Record<string, unknown>).role)
                          ? ((profile.buyer_persona as Record<string, unknown>).role as string[]).map((role, i) => (
                              <li key={i} style={{ fontSize: '14px' }}>
                                {role}
                              </li>
                            ))
                          : null}
                      </ul>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                        PAIN POINTS
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Array.isArray((profile.buyer_persona as Record<string, unknown>).pain_points)
                          ? ((profile.buyer_persona as Record<string, unknown>).pain_points as string[])
                              .slice(0, 2)
                              .map((pain, i) => (
                                <li key={i} style={{ fontSize: '13px', lineHeight: 1.4 }}>
                                  {pain.substring(0, 50)}...
                                </li>
                              ))
                          : null}
                      </ul>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                        KEY GOALS
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Array.isArray((profile.buyer_persona as Record<string, unknown>).goals)
                          ? ((profile.buyer_persona as Record<string, unknown>).goals as string[])
                              .slice(0, 2)
                              .map((goal, i) => (
                                <li key={i} style={{ fontSize: '13px', lineHeight: 1.4 }}>
                                  {goal.substring(0, 50)}...
                                </li>
                              ))
                          : null}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

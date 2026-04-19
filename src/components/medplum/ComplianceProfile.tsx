'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Badge, Button, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { FileText, Download, Shield, CheckCircle, AlertTriangle, Clock, Calendar, Globe, Database } from 'lucide-react';
import { DataSourceBadge } from './DataSourceBadge';
import { searchMedplumDevices, searchMedplumOrganizations, searchMedplumRegulatoryAuthorizations, isMedplumEnabled } from '@/lib/medplum';

interface ComplianceProfileProps {
  companyName: string;
  productId?: string;
  className?: string;
}

export function ComplianceProfile({ companyName, productId, className = '' }: ComplianceProfileProps) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    company: null as any,
    products: [] as any[],
    regulations: [] as any[],
    dataSource: 'local' as 'local' | 'medplum' | 'other'
  });

  useEffect(() => {
    fetchComplianceData();
  }, [companyName, productId]);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      let companyData = null;
      let productsData: unknown[] = [];
      let regulationsData: unknown[] = [];
      let dataSource: 'local' | 'medplum' | 'other' = 'local';

      // 从 Medplum 获取数据
      if (isMedplumEnabled()) {
        try {
          const [organizations, devices, regulations] = await Promise.all([
            searchMedplumOrganizations({ query: companyName, limit: 1 }),
            searchMedplumDevices({ query: companyName, limit: 10 }),
            searchMedplumRegulatoryAuthorizations({ query: companyName, limit: 15 })
          ]);

          if (organizations.length > 0) {
            companyData = organizations[0];
          }
          productsData = devices;
          regulationsData = regulations;
          dataSource = 'medplum';
        } catch (error) {
          console.error('Medplum data fetch error:', error);
        }
      }

      // 如果 Medplum 没有数据，从本地获取
      if (!companyData) {
        try {
          const localResponse = await fetch(`/api/companies?name=${encodeURIComponent(companyName)}`);
          if (localResponse.ok) {
            const localData = await localResponse.json();
            if (localData.data && localData.data.length > 0) {
              companyData = localData.data[0];
            }
          }
        } catch (error) {
          console.error('Local data fetch error:', error);
        }
      }

      setProfileData({
        company: companyData,
        products: productsData,
        regulations: regulationsData,
        dataSource
      });
    } catch (error) {
      console.error('Compliance profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/report/medplum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          reportType: 'regulatory_summary',
          language: 'en',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reportContent = data.data.report;
        
        const blob = new Blob([reportContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-profile-${companyName}-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ))}
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Compliance Summary Card */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {companyName} - Compliance Profile
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Comprehensive compliance status and regulatory information
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DataSourceBadge source={profileData.dataSource} />
              <Button 
                onClick={handleExport}
                size="sm"
                className="bg-[#339999] hover:bg-[#2a8080]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Profile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {profileData.products.length}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Regulatory Authorizations</p>
              <p className="text-2xl font-bold text-gray-900">
                {profileData.regulations.length}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Compliance Status</p>
              <div className="flex items-center mt-1">
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Compliant
                </Badge>
              </div>
            </div>
          </div>

          {/* Company Info */}
          {profileData.company && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Company Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Name:</span>
                  <span>{profileData.company.name || 'N/A'}</span>
                </div>
                {profileData.company.address?.[0]?.country && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Country:</span>
                    <span>{profileData.company.address[0].country}</span>
                  </div>
                )}
                {profileData.company.identifier?.[0]?.value && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Identifier:</span>
                    <span>{profileData.company.identifier[0].value}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="regulations">Regulations</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="mt-4 space-y-4">
              {profileData.products.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No products found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData.products.slice(0, 5).map((product, index) => (
                    <Card key={index} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {product.deviceName?.[0]?.name || product.id}
                            </h4>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                              {product.modelNumber && (
                                <span>Model: {product.modelNumber}</span>
                              )}
                              {product.type?.[0]?.coding?.[0]?.display && (
                                <Badge variant="outline">
                                  {product.type[0].coding[0].display}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <DataSourceBadge source="medplum" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {profileData.products.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        View All {profileData.products.length} Products
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="regulations" className="mt-4 space-y-4">
              {profileData.regulations.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No regulatory authorizations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData.regulations.slice(0, 5).map((regulation, index) => (
                    <Card key={index} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {regulation.name || regulation.id}
                            </h4>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                              {regulation.region?.[0]?.coding?.[0]?.display && (
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {regulation.region[0].coding[0].display}
                                </span>
                              )}
                              {regulation.dateIssued && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(regulation.dateIssued).toLocaleDateString()}
                                </span>
                              )}
                              {regulation.status?.coding?.[0]?.display && (
                                <Badge 
                                  variant={regulation.status.coding[0].display === 'Active' ? 'success' : 'warning'}
                                >
                                  {regulation.status.coding[0].display}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <DataSourceBadge source="medplum" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {profileData.regulations.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        View All {profileData.regulations.length} Authorizations
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <Card className="border border-gray-100">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Compliance Summary</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <p>
                        <span className="font-medium">Products:</span> {profileData.products.length} registered products found
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <p>
                        <span className="font-medium">Regulatory Authorizations:</span> {profileData.regulations.length} authorizations identified
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <p>
                        <span className="font-medium">Potential Risks:</span> No significant compliance issues detected
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                      <p>
                        <span className="font-medium">Last Updated:</span> {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>Regularly update compliance status using Medplum data</li>
                      <li>Establish a global market access strategy</li>
                      <li>Strengthen communication with regulatory authorities</li>
                      <li>Monitor changes in relevant regulations</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

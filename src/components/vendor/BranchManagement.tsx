
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, Building } from 'lucide-react';
import { BranchInfo } from '@/integrations/supabase/modules/vendors';

interface BranchManagementProps {
  branches: BranchInfo[];
  onChange: (branches: BranchInfo[]) => void;
  errors?: string[];
}

const BranchManagement: React.FC<BranchManagementProps> = ({ branches, onChange, errors = [] }) => {
  const addBranch = () => {
    const newBranch: BranchInfo = {
      branchName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      branchProofs: {
        utilityBillUrl: '',
        rentAgreementUrl: '',
        propertyTaxReceiptUrl: ''
      }
    };
    onChange([...branches, newBranch]);
  };

  const removeBranch = (index: number) => {
    const newBranches = branches.filter((_, i) => i !== index);
    onChange(newBranches);
  };

  const updateBranch = (index: number, field: keyof BranchInfo, value: string | string[] | undefined | BranchInfo['branchProofs']) => {
    const newBranches = [...branches];
    if (field === 'branchProofs') {
      newBranches[index] = {
        ...newBranches[index],
        branchProofs: { ...newBranches[index].branchProofs, ...(value as BranchInfo['branchProofs']) }
      };
    } else {
      newBranches[index] = { ...newBranches[index], [field]: value as string | string[] | undefined };
    }
    onChange(newBranches);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="w-5 h-5 mr-2" />
          Branch Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm-[764px]:px-6">
        {branches.map((branch, index) => {
          const branchHasErrors = errors.includes(`branch_${index}`);
          return (
            <Collapsible key={index} className={`border rounded-lg p-4 ${branchHasErrors ? 'border-red-300 bg-red-50' : ''}`}>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="font-medium">
                  {branch.branchName || `Branch ${index + 1}`}
                  {branchHasErrors && <span className="text-red-500 ml-2">*</span>}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBranch(index);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`branchName-${index}`} className="flex items-center mb-2">
                    Branch Name
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id={`branchName-${index}`}
                    value={branch.branchName}
                    onChange={(e) => updateBranch(index, 'branchName', e.target.value)}
                    className={branchHasErrors && (!branch.branchName || branch.branchName.trim() === '') ? 'border-red-500' : ''}
                    required
                  />
                  {branchHasErrors && (!branch.branchName || branch.branchName.trim() === '') && (
                    <p className="text-red-500 text-sm mt-1">Branch name is required</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`contactPerson-${index}`} className='mb-2'>Contact Person</Label>
                  <Input
                    id={`contactPerson-${index}`}
                    value={branch.contactPerson || ''}
                    onChange={(e) => updateBranch(index, 'contactPerson', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`addressLine1-${index}`} className="flex items-center mb-2">
                  Address Line 1
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id={`addressLine1-${index}`}
                  value={branch.addressLine1}
                  onChange={(e) => updateBranch(index, 'addressLine1', e.target.value)}
                  className={branchHasErrors && (!branch.addressLine1 || branch.addressLine1.trim() === '') ? 'border-red-500' : ''}
                  required
                />
                {branchHasErrors && (!branch.addressLine1 || branch.addressLine1.trim() === '') && (
                  <p className="text-red-500 text-sm mt-1">Address line 1 is required</p>
                )}
              </div>

              <div>
                <Label htmlFor={`addressLine2-${index}`} className='mb-2'>Address Line 2</Label>
                <Input
                  id={`addressLine2-${index}`}
                  value={branch.addressLine2 || ''}
                  onChange={(e) => updateBranch(index, 'addressLine2', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`city-${index}`} className="flex items-center mb-2">
                    City
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id={`city-${index}`}
                    value={branch.city}
                    onChange={(e) => updateBranch(index, 'city', e.target.value)}
                    className={branchHasErrors && (!branch.city || branch.city.trim() === '') ? 'border-red-500' : ''}
                    required
                  />
                  {branchHasErrors && (!branch.city || branch.city.trim() === '') && (
                    <p className="text-red-500 text-sm mt-1">City is required</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`state-${index}`} className="flex items-center mb-2">
                    State
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id={`state-${index}`}
                    value={branch.state}
                    onChange={(e) => updateBranch(index, 'state', e.target.value)}
                    className={branchHasErrors && (!branch.state || branch.state.trim() === '') ? 'border-red-500' : ''}
                    required
                  />
                  {branchHasErrors && (!branch.state || branch.state.trim() === '') && (
                    <p className="text-red-500 text-sm mt-1">State is required</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`postalCode-${index}`} className="flex items-center mb-2">
                    Postal Code
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id={`postalCode-${index}`}
                    value={branch.postalCode}
                    onChange={(e) => updateBranch(index, 'postalCode', e.target.value)}
                    className={branchHasErrors && (!branch.postalCode || branch.postalCode.trim() === '') ? 'border-red-500' : ''}
                    required
                  />
                  {branchHasErrors && (!branch.postalCode || branch.postalCode.trim() === '') && (
                    <p className="text-red-500 text-sm mt-1">Postal code is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`contactPhone-${index}`} className='mb-2'>Contact Phone</Label>
                  <Input
                    id={`contactPhone-${index}`}
                    value={branch.contactPhone || ''}
                    onChange={(e) => updateBranch(index, 'contactPhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`contactEmail-${index}`} className='mb-2'>Contact Email</Label>
                  <Input
                    id={`contactEmail-${index}`}
                    type="email"
                    value={branch.contactEmail || ''}
                    onChange={(e) => updateBranch(index, 'contactEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Branch Specific Proofs (Optional)</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor={`utilityBill-${index}`} className='mb-2'>Utility Bill URL</Label>
                    <Input
                      id={`utilityBill-${index}`}
                      type="url"
                      value={branch.branchProofs?.utilityBillUrl || ''}
                      onChange={(e) => updateBranch(index, 'branchProofs', { utilityBillUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`rentAgreement-${index}`} className='mb-2'>Rent Agreement URL</Label>
                    <Input
                      id={`rentAgreement-${index}`}
                      type="url"
                      value={branch.branchProofs?.rentAgreementUrl || ''}
                      onChange={(e) => updateBranch(index, 'branchProofs', { rentAgreementUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`propertyTax-${index}`} className='mb-2'>Property Tax Receipt URL</Label>
                    <Input
                      id={`propertyTax-${index}`}
                      type="url"
                      value={branch.branchProofs?.propertyTaxReceiptUrl || ''}
                      onChange={(e) => updateBranch(index, 'branchProofs', { propertyTaxReceiptUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              {branchHasErrors && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">
                    ⚠️ Please complete all required fields for this branch
                  </p>
                  <ul className="text-red-600 text-sm mt-1 ml-4 list-disc">
                    <li>Branch Name</li>
                    <li>Address Line 1</li>
                    <li>City</li>
                    <li>State</li>
                    <li>Postal Code</li>
                  </ul>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          );
        })}

        {errors.includes('branches') && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">
              ⚠️ Please add at least one branch
            </p>
          </div>
        )}

        <Button type="button" variant="outline" onClick={addBranch} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </CardContent>
    </Card>
  );
};

export default BranchManagement;

import { useState } from "react";
import { PlusCircle, Home, Building, Check, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart, type Address } from "@/contexts/CartContext";
import AddressForm from "./AddressForm";

interface AddressSelectorProps {
  selectedAddressId?: string;
  onSelect: (addressId: string) => void;
}

const AddressSelector = ({
  selectedAddressId,
  onSelect,
}: AddressSelectorProps) => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
  } = useCart();

  const handleAddAddress = async (data: any) => {
    setIsSubmitting(true);
    await addAddress(data);
    setIsSubmitting(false);
    setIsAddFormOpen(false);
  };

  const handleEditAddress = async (data: any) => {
    if (addressToEdit) {
      setIsSubmitting(true);
      await updateAddress({ ...data, id: addressToEdit.id });
      setIsSubmitting(false);
      setIsEditFormOpen(false);
      setAddressToEdit(null);
    }
  };

  const handleRemoveAddress = async (addressId: string) => {
    if (confirm("Are you sure you want to remove this address?")) {
      await removeAddress(addressId);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    await setDefaultAddress(addressId);
  };

  return (
    <>
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-6 text-center">
            <h3 className="mb-2 text-base font-medium">No addresses found</h3>
            <p className="mb-4 text-sm text-gray-500">
              Add a shipping address to continue
            </p>
            <Button onClick={() => setIsAddFormOpen(true)}>Add Address</Button>
          </div>
        ) : (
          <>
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`relative rounded-md border p-4 transition-all ${
                  selectedAddressId === address.id
                    ? "border-sm-red bg-sm-red/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        selectedAddressId === address.id
                          ? "bg-sm-red text-white"
                          : "border border-gray-300"
                      }`}
                      onClick={() => onSelect(address.id)}
                    >
                      {selectedAddressId === address.id && <Check size={12} />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{address.name}</h3>
                        {address.is_default && (
                          <Badge
                            variant="outline"
                            className="border-green-500 bg-green-50 text-green-700"
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                      {address.phone && (
                        <p className="text-sm text-gray-600">{address.phone}</p>
                      )}
                      <p className="text-sm">
                        {address.line1}
                        {address.line2 && `, ${address.line2}`}
                      </p>
                      <p className="text-sm">
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                      <p className="text-sm">{address.country}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAddressToEdit(address);
                        setIsEditFormOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAddress(address.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>

                {!address.is_default && (
                  <Button
                    variant="link"
                    className="mt-2 h-auto p-0 text-sm"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Set as default
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddFormOpen(true)}
            >
              <PlusCircle size={16} className="mr-2" /> Add New Address
            </Button>
          </>
        )}
      </div>

      {/* Add Address Dialog */}
      <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col py-2 px-3 box-border">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Enter the details for your new shipping address.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
            <AddressForm
              onSubmit={handleAddAddress}
              onCancel={() => setIsAddFormOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-3">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Update your shipping address details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {addressToEdit && (
              <AddressForm
                address={addressToEdit}
                onSubmit={handleEditAddress}
                onCancel={() => {
                  setIsEditFormOpen(false);
                  setAddressToEdit(null);
                }}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddressSelector;

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Address } from "@/contexts/CartContext";
import { Country, State, City, IState, ICity } from "country-state-city";

const addressSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z
    .string()
    .regex(/^[0-9]+$/, "Phone number must contain only digits")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .optional()
    .or(z.literal("")),
  is_default: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  address?: Address;
  onSubmit: (data: AddressFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const AddressForm = ({
  address,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AddressFormProps) => {
  const [selectedCountry, setSelectedCountry] = useState(
    address?.country || "IN"
  );
  const [selectedState, setSelectedState] = useState(address?.state || "");
  const [availableStates, setAvailableStates] = useState<IState[]>([]);
  const [availableCities, setAvailableCities] = useState<ICity[]>([]);

  // Get countries (India and UAE)
  const countries = [
    { code: "IN", name: "India" },
    { code: "AE", name: "United Arab Emirates" },
  ];

  // Initialize states when component mounts or address changes
  useEffect(() => {
    if (selectedCountry) {
      const states = State.getStatesOfCountry(selectedCountry);
      setAvailableStates(states);
      
      // If editing and address has state, load cities for that state
      if (address?.state && address.country === selectedCountry) {
        const cities = City.getCitiesOfState(selectedCountry, address.state);
        setAvailableCities(cities);
        setSelectedState(address.state);
      } else if (!address) {
        // Only reset if not editing
        setSelectedState("");
        form.setValue("state", "");
        form.setValue("city", "");
        setAvailableCities([]);
      }
    }
  }, [selectedCountry, address?.country, address?.state]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedState && selectedCountry) {
      const cities = City.getCitiesOfState(selectedCountry, selectedState);
      setAvailableCities(cities);
      
      // If editing and address has city for this state, keep it
      if (address?.state === selectedState && address?.city) {
        form.setValue("city", address.city);
      } else if (!address || address.state !== selectedState) {
        // Reset city if state changed or not editing
        form.setValue("city", "");
      }
    }
  }, [selectedState, selectedCountry, address?.state, address?.city]);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema) as any,
    defaultValues: {
      name: address?.name || "",
      line1: address?.line1 || "",
      line2: address?.line2 || "",
      city: address?.city || "",
      state: address?.state || "",
      postal_code: address?.postal_code || "",
      country: address?.country || "IN",
      phone: address?.phone || "",
      is_default: address?.is_default || false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="1234567890" 
                  type="tel"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="line1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="line2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2 (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apt 4B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedState}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedState ? "Select city" : "Select state first"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / Province</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedState(value);
                  }}
                  disabled={!selectedCountry}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedCountry
                            ? "Select state"
                            : "Select country first"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableStates.map((state) => (
                      <SelectItem key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="10001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedCountry(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as default address</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Address"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddressForm;

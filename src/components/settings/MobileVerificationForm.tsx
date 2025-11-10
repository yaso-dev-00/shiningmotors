import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Phone, CheckCircle } from "lucide-react";
import { countries } from "@/lib/countries";

// Country code mapping for phone number formatting
const countryCodeMap: Record<string, string> = {
  "US": "+1",
  "CA": "+1", 
  "MX": "+52",
  "GB": "+44",
  "FR": "+33",
  "DE": "+49",
  "IT": "+39",
  "ES": "+34",
  "JP": "+81",
  "AU": "+61",
  "CN": "+86",
  "IN": "+91",
  "BR": "+55",
};

interface MobileVerificationFormProps {
  currentPhone?: string | null;
  isVerified?: boolean;
  onPhoneUpdated: (phone: string) => void;
}

const MobileVerificationForm = ({ 
  currentPhone, 
  isVerified = false, 
  onPhoneUpdated 
}: MobileVerificationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [countryCode, setCountryCode] = useState("US");
  const [phoneNumber, setPhoneNumber] = useState(
    currentPhone ? currentPhone.replace(/^\+\d+/, "") : ""
  );
  const [otp, setOtp] = useState("");
  const [validationCode, setValidationCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isChangingNumber, setIsChangingNumber] = useState(false);

  const getFullPhoneNumber = () => {
    const prefix = countryCodeMap[countryCode] || "+1";
    return `${prefix}${phoneNumber.replace(/^\+\d+/, "")}`;
  };

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    
    // Check if this is the same number as current
    if (currentPhone && fullPhoneNumber === currentPhone && isVerified) {
      toast({
        title: "Same number",
        description: "This is your current verified number",
        variant: "destructive",
      });
      return;
    }
    
    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(fullPhoneNumber)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phoneNumber: fullPhoneNumber },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setValidationCode(data.validationCode);
        setShowOtpInput(true);
        toast({
          title: "Validation request created",
          description: `Call ${data.validationCode} from your phone to verify`,
        });
      } else {
        throw new Error(data.error || "Failed to create validation request");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || !user) {
      toast({
        title: "OTP required",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { 
          phoneNumber: fullPhoneNumber, 
          otp, 
          userId: user.id 
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        // Update the database with verified phone
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            mobile_phone: fullPhoneNumber, 
            phone_verified: true 
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
        }

        onPhoneUpdated(fullPhoneNumber); // Save full number with country code
        setShowOtpInput(false);
        setOtp("");
        setIsChangingNumber(false);
        toast({
          title: "Phone verified",
          description: "Your phone number has been verified successfully",
        });
      } else {
        throw new Error(data.error || "Failed to verify OTP");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please try again",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = () => {
    setOtp("");
    handleSendOTP();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Mobile Phone Verification
          {isVerified && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          {isVerified 
            ? "Your phone number is verified. You can change it below if needed." 
            : "Verify your phone number to receive important notifications and secure your account"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select 
            value={countryCode} 
            onValueChange={setCountryCode} 
            disabled={(isVerified && !isChangingNumber) || sending || verifying}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {countryCodeMap[country.value]} {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <div className="flex items-center justify-center px-3 py-2 border border-input bg-background text-sm rounded-md min-w-[80px]">
              {countryCodeMap[countryCode]}
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              disabled={(isVerified && !isChangingNumber) || sending || verifying}
              className="flex-1"
            />
          </div>
        </div>

        {!showOtpInput && !isVerified && (
          <Button 
            onClick={handleSendOTP} 
            disabled={sending || !phoneNumber}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send Verification Code"
            )}
          </Button>
        )}

        {!showOtpInput && isVerified && !isChangingNumber && (
          <Button 
            onClick={() => setIsChangingNumber(true)}
            variant="outline"
            className="w-full"
          >
            Change Number
          </Button>
        )}

        {!showOtpInput && isChangingNumber && (
          <div className="flex gap-2">
            <Button 
              onClick={handleSendOTP} 
              disabled={sending || !phoneNumber}
              className="flex-1"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
            <Button 
              onClick={() => {
                setIsChangingNumber(false);
                setPhoneNumber(currentPhone ? currentPhone.replace(/^\+\d+/, "") : "");
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        )}

        {showOtpInput && (
          <div className="space-y-4">
            {validationCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Call this number from your phone to verify:
                </div>
                <div className="text-lg font-bold text-blue-700 text-center bg-white rounded px-3 py-2 border">
                  {validationCode}
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  Once you call this number, enter the 6-digit code you hear below.
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={verifying}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleVerifyOTP} 
                disabled={verifying || otp.length !== 6}
                className="flex-1"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
              
              <Button 
                onClick={handleResendOTP} 
                variant="outline"
                disabled={sending}
              >
                Resend
              </Button>
            </div>
          </div>
        )}

        {isVerified && !isChangingNumber && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Phone number verified: {currentPhone}
            </div>
            <div className="text-xs text-muted-foreground">
              You'll receive important notifications and security alerts on this number.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileVerificationForm;
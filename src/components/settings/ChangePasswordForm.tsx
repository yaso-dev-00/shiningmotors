import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff } from "lucide-react";
import { passwordSchema, type PasswordInput } from "@/lib/validations/settings";

const ChangePasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user is logged in with OAuth provider
  const isOAuthUser =
    user?.app_metadata?.provider && user.app_metadata.provider !== "email";
  const providerName = isOAuthUser ? user?.app_metadata?.provider : null;

  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current: "",
      new: "",
      confirm: "",
    },
  });

  // Add watch for password changes
  const currentPassword = form.watch("current");
  const newPassword = form.watch("new");
  const confirmPassword = form.watch("confirm");

  const hasPasswordChanged = currentPassword && newPassword && confirmPassword;

  const onSubmit = async (data: PasswordInput) => {
    if (data.new !== data.confirm) {
      form.setError("confirm", {
        type: "manual",
        message: "Passwords don't match",
      });
      return;
    }

    try {
      setIsLoading(true);

      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: data.current,
      });

      if (signInError) {
        form.setError("current", {
          type: "manual",
          message: "Current password is incorrect",
        });
        throw signInError;
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: data.new,
      });

      if (error) throw error;

      // Reset form
      form.reset({
        current: "",
        new: "",
        confirm: "",
      });

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
    } catch (error: any) {
      if (!error.message.includes("incorrect")) {
        toast({
          title: "Error updating password",
          description: error.message || "Failed to update password.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    if (field === "current") setShowCurrentPassword(!showCurrentPassword);
    if (field === "new") setShowNewPassword(!showNewPassword);
    if (field === "confirm") setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="max-[769px]:text-xl">Password</CardTitle>
        <CardDescription>
          {isOAuthUser
            ? `Password management for ${providerName || 'OAuth'} accounts`
            : "Update your password"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isOAuthUser ? (
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              You're signed in with{" "}
              {(providerName?.charAt(0) || '').toUpperCase() + (providerName?.slice(1) || '')}.
              Password management is handled by your {providerName || 'OAuth'} account.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={() => togglePasswordVisibility("current")}
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="new"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={() => togglePasswordVisibility("new")}
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={() => togglePasswordVisibility("confirm")}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-sm-red hover:bg-sm-red-light"
                disabled={isLoading || !hasPasswordChanged}
              >
                {isLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;

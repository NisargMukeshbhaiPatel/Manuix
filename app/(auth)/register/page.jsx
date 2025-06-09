"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { toast } from "@/hooks/use-toast";
import { registerUser } from "@/actions/auth";
import ManuixLogo from "@/components/logo";
import { Eye, EyeOff, Check } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const router = useRouter();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Create FormData object to match the old component's format
    const submitFormData = new FormData();
    submitFormData.append("name", formData.name);
    submitFormData.append("email", formData.email);
    submitFormData.append("password", formData.password);
    submitFormData.append("confirmPassword", formData.confirmPassword);

    try {
      const result = await registerUser(submitFormData);

      if (result.error) {
        toast({
          title: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created successfully! Please sign in.",
          variant: "default",
        });
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <ManuixLogo width={56} height={56} />
          <h1 className="text-4xl font-black text-black tracking-tight">
            MANUIX
          </h1>
        </div>

        {/* Register Form */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-8 mb-6">
          <h2 className="text-2xl font-black text-black mb-6 text-center">
            CREATE ACCOUNT
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john@company.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <button
                type="button"
                onClick={() =>
                  handleInputChange("agreeToTerms", !formData.agreeToTerms)
                }
                className={`w-6 h-6 border-3 border-black flex items-center justify-center ${
                  formData.agreeToTerms ? "bg-green-400" : "bg-white"
                } hover:bg-gray-100 transition-colors`}
                disabled={loading}
              >
                {formData.agreeToTerms && (
                  <Check size={16} className="text-black" />
                )}
              </button>
              <div className="text-sm font-bold text-black">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-2 hover:text-gray-600"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-gray-600"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            <Button type="submit" disabled={!formData.agreeToTerms || loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </div>

        {/* Login Link */}
        <div className="bg-orange-400 border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 text-center">
          <p className="text-black font-bold mb-3">Already have an account?</p>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

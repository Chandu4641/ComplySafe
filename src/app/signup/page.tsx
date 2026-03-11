"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
    industry: "",
    region: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First create the organization
      const orgResponse = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.orgName,
          industry: formData.industry,
          region: formData.region,
          password: formData.password
        })
      });

      if (!orgResponse.ok) {
        throw new Error("Failed to create organization");
      }

      const orgData = await orgResponse.json();
      
      // Then create the user/login
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          orgId: orgData.organization?.id || orgData.id,
          name: formData.name
        })
      });

      if (!loginResponse.ok) {
        throw new Error("Failed to create account");
      }

      // Redirect to onboarding or dashboard
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h1>Create your ComplySafe account</h1>
          <p>Start your compliance journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="orgName">Organization Name</label>
            <input
              type="text"
              id="orgName"
              name="orgName"
              value={formData.orgName}
              onChange={handleChange}
              placeholder="Acme Inc."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
              >
                <option value="">Select industry</option>
                <option value="saas">SaaS</option>
                <option value="fintech">FinTech</option>
                <option value="healthcare">Healthcare</option>
                <option value="ecommerce">E-commerce</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail</option>
                <option value="technology">Technology</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="region">Region</label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
              >
                <option value="">Select region</option>
                <option value="US">United States</option>
                <option value="EU">European Union</option>
                <option value="UK">United Kingdom</option>
                <option value="India">India</option>
                <option value="APAC">Asia Pacific</option>
                <option value="Global">Global</option>
              </select>
            </div>
          </div>

          <button type="submit" className="cta submit-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{" "}
            <Link href="/login">Login</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          padding: 20px;
        }
        .signup-container {
          background: white;
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .signup-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .signup-header h1 {
          font-size: 24px;
          color: #111827;
          margin: 0 0 8px;
        }
        .signup-header p {
          color: #6b7280;
          margin: 0;
        }
        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        input, select {
          padding: 12px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        input:focus, select:focus {
          outline: none;
          border-color: #0f7f8a;
        }
        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }
        .submit-btn {
          margin-top: 8px;
          padding: 14px;
          font-size: 16px;
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .signup-footer {
          text-align: center;
          margin-top: 24px;
          color: #6b7280;
        }
        .signup-footer a {
          color: #0f7f8a;
          text-decoration: none;
          font-weight: 500;
        }
        .signup-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

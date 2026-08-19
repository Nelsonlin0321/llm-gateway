"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ComponentProps } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { updateProfile } from "@/app/server-actions/profile/update-profile";
import { validateUpdateProfileInput } from "@/lib/profile/service";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type ProfileFormValues = {
  name: string;
  image: string;
};

type ProfileSettingsFormProps = {
  initialName: string;
  initialImage: string | null;
  email: string;
};

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

const inputClassName = cn(
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40",
);

const fieldLabelClassName =
  "text-sm font-medium tracking-[-0.01em] text-text-primary";

function FieldError({
  errors,
  helperText,
}: {
  errors?: string[];
  helperText?: string;
}) {
  if (errors?.length) {
    return <p className="text-sm text-error">{errors[0]}</p>;
  }

  if (!helperText) {
    return null;
  }

  return <p className="text-sm text-text-secondary">{helperText}</p>;
}

export function ProfileSettingsForm({
  initialName,
  initialImage,
  email,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileFormValues>({
    name: initialName,
    image: initialImage ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const updateValue = <T extends keyof ProfileFormValues>(
    key: T,
    value: ProfileFormValues[T],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const displayInitials = useMemo(
    () => getInitials(values.name, email),
    [values.name, email],
  );

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setGeneralError(null);

    const payload = {
      name: values.name,
      image: values.image.trim() ? values.image.trim() : undefined,
    };

    const parsed = validateUpdateProfileInput(payload);
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error as z.ZodError).fieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await updateProfile(parsed.data);

      if (!result.ok) {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save profile.";
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Profile Settings"
        description="Customize your avatar and display name shown across the portal."
        actions={
          <button
            type="button"
            onClick={() => router.back()}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-transparent px-3 text-[13px] font-medium text-text-primary transition-colors hover:bg-surface-2",
            )}
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card size="default">
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>
              Choose how your avatar appears in the portal. You can use an image
              URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center justify-center">
              <Avatar className="size-20">
                {values.image.trim() ? (
                  <AvatarImage
                    src={values.image.trim()}
                    alt={values.name || email}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : null}
                <AvatarFallback className="text-lg">
                  {displayInitials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor="profile-image" className={fieldLabelClassName}>
                Avatar image URL
              </Label>
              <div className="relative">
                <Input
                  id="profile-image"
                  type="url"
                  value={values.image}
                  onChange={(event) => updateValue("image", event.target.value)}
                  placeholder="https://example.com/your-avatar.png"
                  className={cn(inputClassName, "pl-9")}
                  autoComplete="off"
                />
                <Upload className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
              </div>
              <FieldError
                errors={fieldErrors.image}
                helperText="Paste a direct link to an image (PNG, JPG, or WebP). Leave blank to use your initials."
              />
            </div>
          </CardContent>
        </Card>

        <Card size="default">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details shown on your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className={fieldLabelClassName}>
                Display name
              </Label>
              <Input
                id="profile-name"
                type="text"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="Your name"
                className={inputClassName}
                autoComplete="name"
              />
              <FieldError
                errors={fieldErrors.name}
                helperText="This is how your name appears across the workspace."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email" className={fieldLabelClassName}>
                Email
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                disabled
                className={cn(inputClassName, "opacity-60")}
                autoComplete="email"
              />
              <p className="text-sm text-text-secondary">
                Your email is managed through your sign-in method.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            {generalError ? (
              <p className="w-full text-sm text-error">{generalError}</p>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="default"
              className="w-full sm:w-auto"
              onClick={() => {
                setValues({ name: initialName, image: initialImage ?? "" });
                setFieldErrors({});
                setGeneralError(null);
              }}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              size="default"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving changes..." : "Save changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </section>
  );
}

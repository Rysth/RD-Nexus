import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Facebook,
  Instagram,
  Loader2,
  Lock,
  Phone,
  Save,
  Share2,
  Store,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import PasswordInput from "../../../components/shared/PasswordInput";
import { useAuthStore } from "../../../stores/authStore";
import { useBusinessStore } from "../../../stores/businessStore";
import { useProfileStore } from "../../../stores/profileStore";

interface BusinessFormData {
  name: string;
  slogan: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  logo?: FileList;
}

interface ProfileFormData {
  fullname: string;
  username: string;
  email: string;
}

interface PasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export default function BusinessSettings() {
  const { user: currentUser, updateUser } = useAuthStore();
  const { business, isLoading, fetchBusiness, updateBusiness, error } =
    useBusinessStore();
  const {
    updateProfile,
    updatePassword,
    isLoading: isProfileLoading,
  } = useProfileStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [isProfileCooldown, setIsProfileCooldown] = useState(false);
  const [isPasswordCooldown, setIsPasswordCooldown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManageBusiness = currentUser?.roles.some((role) =>
    ["admin", "manager"].includes(role)
  );

  // Business form
  const businessForm = useForm<BusinessFormData>();

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      fullname: currentUser?.fullname || "",
      username: currentUser?.username || "",
      email: currentUser?.email || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  useEffect(() => {
    if (business) {
      businessForm.reset({
        name: business.name || "",
        slogan: business.slogan || "",
        whatsapp: business.whatsapp || "",
        instagram: business.instagram || "",
        facebook: business.facebook || "",
        tiktok: business.tiktok || "",
      });
      setPreview(business.logo_url || null);
    }
  }, [business, businessForm]);

  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        fullname: currentUser.fullname || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
      });
    }
  }, [currentUser, profileForm]);

  const logoFile = businessForm.watch("logo");

  useEffect(() => {
    if (logoFile && logoFile.length > 0) {
      const file = logoFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [logoFile]);

  const onBusinessSubmit = async (data: BusinessFormData) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("slogan", data.slogan || "");
      formData.append("whatsapp", data.whatsapp || "");
      formData.append("instagram", data.instagram || "");
      formData.append("facebook", data.facebook || "");
      formData.append("tiktok", data.tiktok || "");

      if (data.logo && data.logo[0]) {
        formData.append("logo", data.logo[0]);
      }

      await updateBusiness(formData);
      toast.success("Configuración del negocio guardada exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar configuración");
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (isProfileCooldown) {
      toast.error("Por favor espera un momento antes de actualizar nuevamente");
      return;
    }

    try {
      setIsProfileCooldown(true);
      const updatedUser = await updateProfile(data);
      updateUser(updatedUser);
      toast.success("Perfil actualizado exitosamente");

      // Set cooldown for 3 seconds
      setTimeout(() => {
        setIsProfileCooldown(false);
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar perfil");
      setIsProfileCooldown(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (isPasswordCooldown) {
      toast.error("Por favor espera un momento antes de actualizar nuevamente");
      return;
    }

    try {
      setIsPasswordCooldown(true);
      await updatePassword(data);
      toast.success("Contraseña actualizada exitosamente");
      passwordForm.reset();

      // Set cooldown for 3 seconds
      setTimeout(() => {
        setIsPasswordCooldown(false);
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar contraseña");
      setIsPasswordCooldown(false);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Compose file input ref with react-hook-form register to avoid duplicate ref warnings
  const logoRegister = businessForm.register("logo", {
    validate: {
      fileSize: (files) => {
        if (!files || files.length === 0) return true;
        const file = files[0];
        if (file.size > 2 * 1024 * 1024) {
          return "El logo debe ser menor a 2MB";
        }
        return true;
      },
      fileType: (files) => {
        if (!files || files.length === 0) return true;
        const file = files[0];
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
          return "Solo se permiten archivos JPG, PNG o WEBP";
        }
        return true;
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManageBusiness) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Acceso Denegado
            </h2>
            <p className="text-muted-foreground">
              No tienes permisos para acceder a esta sección.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business" className="gap-2">
            <Store className="w-4 h-4" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Mi Perfil
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="w-4 h-4" />
            Contraseña
          </TabsTrigger>
        </TabsList>

        {/* Business Settings Tab */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Negocio</CardTitle>
              <CardDescription>
                Actualiza la información y redes sociales de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={businessForm.handleSubmit(onBusinessSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Logo Upload */}
                  <div className="space-y-4 lg:col-span-1">
                    <div>
                      <Label>Logo del Negocio</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Recomendado: 300x300px • Máximo: 2MB
                      </p>
                    </div>

                    <div
                      className="flex items-center justify-center w-full overflow-hidden transition-all border-2 border-dashed rounded-lg cursor-pointer aspect-square bg-muted border-muted-foreground/25 hover:border-primary/50 group"
                      onClick={handleImageClick}
                    >
                      {preview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={preview}
                            alt="Logo Preview"
                            className="object-contain w-full h-full bg-white"
                          />
                          <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                            <div className="text-center text-white">
                              <Upload className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm font-medium">
                                Cambiar logo
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Upload className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm font-medium">
                            Click para seleccionar
                          </p>
                          <p className="mt-1 text-xs">PNG, JPG, WEBP</p>
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      name={logoRegister.name}
                      onChange={logoRegister.onChange}
                      onBlur={logoRegister.onBlur}
                      ref={(el) => {
                        fileInputRef.current = el;
                        logoRegister.ref(el);
                      }}
                    />
                    {businessForm.formState.errors.logo && (
                      <p className="text-sm text-destructive">
                        {businessForm.formState.errors.logo.message}
                      </p>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6 lg:col-span-2">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Store className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          Información Básica
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre del Negocio *</Label>
                          <Input
                            id="name"
                            placeholder="Ej: MicroSystems"
                            {...businessForm.register("name", {
                              required: "El nombre es requerido",
                              maxLength: {
                                value: 100,
                                message: "Máximo 100 caracteres",
                              },
                            })}
                          />
                          {businessForm.formState.errors.name && (
                            <p className="text-sm text-destructive">
                              {businessForm.formState.errors.name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="slogan">Eslogan</Label>
                          <Input
                            id="slogan"
                            placeholder="Ej: Powered by RysthDesign"
                            {...businessForm.register("slogan", {
                              maxLength: {
                                value: 200,
                                message: "Máximo 200 caracteres",
                              },
                            })}
                          />
                          {businessForm.formState.errors.slogan && (
                            <p className="text-sm text-destructive">
                              {businessForm.formState.errors.slogan.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Phone className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Contacto</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          type="tel"
                          placeholder="+593985784621"
                          {...businessForm.register("whatsapp", {
                            pattern: {
                              value: /^\+?[1-9]\d{1,14}$/,
                              message: "Número de teléfono inválido",
                            },
                          })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Incluye código de país (ej: +593 para Ecuador)
                        </p>
                        {businessForm.formState.errors.whatsapp && (
                          <p className="text-sm text-destructive">
                            {businessForm.formState.errors.whatsapp.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Share2 className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          Redes Sociales
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="instagram">Instagram</Label>
                          <div className="relative">
                            <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="instagram"
                              className="pl-10"
                              placeholder="usuario"
                              {...businessForm.register("instagram", {
                                pattern: {
                                  value: /^[a-zA-Z0-9._]+$/,
                                  message: "Usuario inválido",
                                },
                              })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="facebook">Facebook</Label>
                          <div className="relative">
                            <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="facebook"
                              className="pl-10"
                              placeholder="usuario"
                              {...businessForm.register("facebook", {
                                pattern: {
                                  value: /^[a-zA-Z0-9.]+$/,
                                  message: "Usuario inválido",
                                },
                              })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tiktok">TikTok</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                              @
                            </span>
                            <Input
                              id="tiktok"
                              className="pl-10"
                              placeholder="usuario"
                              {...businessForm.register("tiktok", {
                                pattern: {
                                  value: /^[a-zA-Z0-9._]+$/,
                                  message: "Usuario inválido",
                                },
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {!isLoading && <Save className="w-4 h-4 mr-2" />}
                    Guardar Configuración
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
              <CardDescription>
                Actualiza tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="profile-fullname">Nombre Completo *</Label>
                  <Input
                    id="profile-fullname"
                    placeholder="Juan Pérez"
                    {...profileForm.register("fullname", {
                      required: "El nombre completo es requerido",
                    })}
                  />
                  {profileForm.formState.errors.fullname && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.fullname.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-username">Nombre de Usuario *</Label>
                  <Input
                    id="profile-username"
                    placeholder="juanperez"
                    {...profileForm.register("username", {
                      required: "El nombre de usuario es requerido",
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message:
                          "Solo letras, números y guiones bajos permitidos",
                      },
                    })}
                  />
                  {profileForm.formState.errors.username && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Correo Electrónico *</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    {...profileForm.register("email", {
                      required: "El correo electrónico es requerido",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Formato de correo inválido",
                      },
                    })}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={isProfileLoading || isProfileCooldown}
                  >
                    {(isProfileLoading || isProfileCooldown) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {!isProfileLoading && !isProfileCooldown && (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isProfileCooldown
                      ? "Espera un momento..."
                      : "Actualizar Perfil"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña de acceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Por seguridad, debes ingresar tu contraseña actual. La nueva
                    contraseña debe tener al menos 8 caracteres.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Actual *</Label>
                  <PasswordInput
                    register={passwordForm.register("current_password", {
                      required: "La contraseña actual es requerida",
                    })}
                    placeholder="••••••••"
                    name="current_password"
                    autoComplete="current-password"
                  />
                  {passwordForm.formState.errors.current_password && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.current_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña *</Label>
                  <PasswordInput
                    register={passwordForm.register("password", {
                      required: "La contraseña es requerida",
                      minLength: {
                        value: 8,
                        message: "Mínimo 8 caracteres",
                      },
                    })}
                    placeholder="••••••••"
                    name="password"
                    autoComplete="new-password"
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-confirmation">
                    Confirmar Contraseña *
                  </Label>
                  <PasswordInput
                    register={passwordForm.register("password_confirmation", {
                      required: "La confirmación es requerida",
                      validate: (value) =>
                        value === passwordForm.watch("password") ||
                        "Las contraseñas no coinciden",
                    })}
                    placeholder="••••••••"
                    name="password_confirmation"
                    autoComplete="new-password"
                  />
                  {passwordForm.formState.errors.password_confirmation && (
                    <p className="text-sm text-destructive">
                      {
                        passwordForm.formState.errors.password_confirmation
                          .message
                      }
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={isProfileLoading || isPasswordCooldown}
                  >
                    {(isProfileLoading || isPasswordCooldown) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {!isProfileLoading && !isPasswordCooldown && (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isPasswordCooldown
                      ? "Espera un momento..."
                      : "Actualizar Contraseña"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

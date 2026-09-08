import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const setting = await prisma.setting.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Sesuaikan akun, tampilan, notifikasi, dan datamu.</p>
      </div>
      <SettingsForm
        user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
        setting={{
          theme: setting.theme,
          emailNotification: setting.emailNotification,
          pushNotification: setting.pushNotification,
          defaultPriority: setting.defaultPriority,
          defaultCategoryId: setting.defaultCategoryId,
          reminderEmail: setting.reminderEmail,
        }}
      />
    </div>
  );
}

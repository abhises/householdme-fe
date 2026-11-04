import { redirect } from "next/navigation";

// Buying guides are listed on the admin start page, like posts in the BrasQ admin.
export default function GuidesIndex() {
  redirect("/admin");
}

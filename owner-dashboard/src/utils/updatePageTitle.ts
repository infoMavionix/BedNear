
export function updatePageTitle(role?: string) {
  if (role === "ADMIN") {
    document.title = "Admin Dashboard | BedNear";
  } else if (role === "OWNER") {
    document.title = "Owner Dashboard | BedNear";
  } else {
    document.title = "BedNear";
  }
}

import { authRequest } from "@/lib/authApi";
import type { Member, RawMemberData } from "@/types/member";

function deserializeMember(raw: RawMemberData): Member {
  const {
    first_name: firstName,
    last_name: lastName,
    discord_username: discordUsername,
    discord_id: discordId,
    profile_picture_url: profilePictureUrl,
    created,
    ...rest
  } = raw;
  return {
    ...rest,
    firstName,
    lastName,
    discordUsername,
    discordId,
    profilePictureUrl,
    created: new Date(created),
  };
}

export async function getCurrentUser(): Promise<Member> {
  const res = await authRequest<RawMemberData>("/members/profile/");
  if (res.status !== 200) throw new Error("Failed to get current user");
  return deserializeMember(res.data);
}

export async function isCurrentMemberVerified(): Promise<boolean> {
  try {
    const member = await getCurrentUser();
    return member.groups?.some((g) => g.name === "is_verified") ?? false;
  } catch {
    return false;
  }
}

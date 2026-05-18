import { useState } from "react";
import { useHandle, useStoredAvatar, xAvatarUrl } from "@/lib/profiles";
import { avatarUrl } from "@/lib/wallet";

export function WalletAvatar({
  address,
  className,
  alt = "",
}: {
  address: string;
  className?: string;
  alt?: string;
}) {
  const handle = useHandle(address);
  const stored = useStoredAvatar(address);
  const [errored, setErrored] = useState(false);
  const src = !errored
    ? stored || (handle ? xAvatarUrl(handle) : avatarUrl(address))
    : avatarUrl(address);
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      loading="lazy"
    />
  );
}

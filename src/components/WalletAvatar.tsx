import { useState } from "react";
import { useHandle, xAvatarUrl } from "@/lib/profiles";
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
  const [errored, setErrored] = useState(false);
  const src = handle && !errored ? xAvatarUrl(handle) : avatarUrl(address);
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

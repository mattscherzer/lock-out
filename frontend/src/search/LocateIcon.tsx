import { Locate, LocateFixed, LocateOff, type LucideProps } from "lucide-react";

type Props = Omit<LucideProps, "ref"> & { blocked: boolean; located: boolean };

// off: permission denied; fixed: a position is on the map; plain: none shared yet
export function LocateIcon({ blocked, located, ...rest }: Props) {
  const Icon = blocked ? LocateOff : located ? LocateFixed : Locate;
  return <Icon aria-hidden {...rest} />;
}

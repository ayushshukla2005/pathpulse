import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { MobilityProfile } from "../routing";

export class FindRouteDto {
  @IsUUID()
  @IsNotEmpty()
  buildingId!: string;

  @IsUUID()
  @IsNotEmpty()
  originNodeId!: string;

  @IsUUID()
  @IsNotEmpty()
  destinationNodeId!: string;

  @IsEnum({
    WHEELCHAIR: "WHEELCHAIR",
    LIMITED_MOBILITY: "LIMITED_MOBILITY",
    VISUALLY_IMPAIRED: "VISUALLY_IMPAIRED",
    HEARING_IMPAIRED: "HEARING_IMPAIRED",
    STROLLER: "STROLLER",
    CUSTOM: "CUSTOM",
  })
  @IsNotEmpty()
  profile!: MobilityProfile;
}

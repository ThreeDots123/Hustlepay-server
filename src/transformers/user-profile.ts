import transformerFactory from "./factory";
import { FreelancerProfile } from "src/model/freelancer-profile.entity";
import { ClientProfile } from "src/model/client-profile.entity";
import { FreelancerProfileDto } from "src/profile/dto/freelancer-profile.dto";
import { ClientProfileDto } from "src/profile/dto/client-profile.dto";

function transformUserProfile(
  profile: Partial<FreelancerProfile> | Partial<ClientProfile>,
) {
  return transformerFactory(
    profile,
    profile instanceof FreelancerProfile
      ? FreelancerProfileDto
      : ClientProfileDto,
  );
}

export default transformUserProfile;

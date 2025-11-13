import { Gig } from "src/model/gig.entity";
import transformerFactory from "./factory";
import { GigResponseDto } from "src/gigs/dto/gig-response";

export default function transformFreelancerGig(gig: Partial<Gig>) {
  return transformerFactory(gig, GigResponseDto);
}

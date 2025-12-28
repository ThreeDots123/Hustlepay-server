// @ts-nocheck

import { DataSource } from "typeorm";
import seedData from "./proposals-seed.json"; // Your JSON file
import { SkillCatalog } from "src/model/skill-catalog.entity";
import { Proposal } from "src/model/proposal.entity";
import { CategoryCatalog } from "src/model/category-catalog.entity";

export async function seedProposals(dataSource: DataSource) {
  const proposalRepository = dataSource.getRepository(Proposal);
  const skillRepository = dataSource.getRepository(SkillCatalog);
  const categoryRepository = dataSource.getRepository(CategoryCatalog);

  console.log("Starting proposal seeding...");

  try {
    // Handle array or single object
    const proposals = Array.isArray(seedData) ? seedData : [seedData];

    for (const proposalData of proposals) {
      // First, handle skills separately
      const skills = [];
      if (proposalData.skills && proposalData.skills.length > 0) {
        for (const skillData of proposalData.skills) {
          // Check if skill exists, if not create it
          let skill = await skillRepository.findOne({
            where: { name: skillData.name },
          });

          if (!skill) {
            skill = skillRepository.create(skillData);
            await skillRepository.save(skill);
            console.log(`Created skill: ${skill.name}`);
          }

          skills.push(skill);
        }
      }

      // Secondly, handle categories separately
      const categories = [];
      if (proposalData.categories && proposalData.categories.length > 0) {
        for (const categoryName of proposalData.categories) {
          // Check if skill exists, if not create it
          let category = await categoryRepository.findOne({
            where: { name: categoryName },
          });

          if (!category) {
            category = categoryRepository.create({ name: categoryName });
            await categoryRepository.save(category);
            console.log(`Created category: ${category}`);
          }

          categories.push(category);
        }
      }

      // Check if proposal already exists
      const existingProposal = await proposalRepository.findOne({
        where: { id: proposalData.id },
      });

      if (existingProposal) {
        console.log(`Proposal ${proposalData.id} already exists, skipping...`);
        continue;
      }

      // Create proposal without skills and categories arrays in the data
      const {
        skills: _,
        categories: __,
        ...proposalDataWithoutSkills
      } = proposalData;

      const proposal = proposalRepository.create({
        ...proposalDataWithoutSkills,
        skills, // Attach the skill entities
        categories,
      });

      await proposalRepository.save(proposal);
      console.log(`Seeded proposal: ${proposal.title} (${proposal.id})`);
    }

    console.log("✅ Proposal seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during proposal seeding:", error);
    throw error;
  }
}

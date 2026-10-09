import { prisma } from '../../config/database.js';

// ─── Career Profile ────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  return prisma.careerProfile.findUnique({
    where: { userId },
    include: {
      experiences: { orderBy: { startDate: 'desc' } },
      education: { orderBy: { startDate: 'desc' } },
      projects: { orderBy: { createdAt: 'desc' } },
      skills: { orderBy: { name: 'asc' } },
      certifications: { orderBy: { issueDate: 'desc' } },
      achievements: { orderBy: { date: 'desc' } },
    },
  });
}

export async function upsertProfile(
  userId: string,
  data: {
    headline?: string;
    summary?: string;
    targetRole?: string;
    targetLevel?: string;
  },
) {
  return prisma.careerProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

// Also update user's name/avatarUrl if provided
export async function updateUserProfile(
  userId: string,
  data: { name?: string; avatarUrl?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, avatarUrl: true, email: true },
  });
}

// ─── Experiences ──────────────────────────────────────────────────────────────

export async function getExperiences(userId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.experience.findMany({
    where: { careerProfileId: profile.id },
    orderBy: { startDate: 'desc' },
  });
}

export async function createExperience(
  userId: string,
  data: {
    company: string;
    title: string;
    employmentType?: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent?: boolean;
    description?: string;
  },
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  return prisma.experience.create({
    data: { careerProfileId: profile.id, ...data },
  });
}

export async function updateExperience(
  userId: string,
  experienceId: string,
  data: Partial<{
    company: string;
    title: string;
    employmentType: string;
    location: string;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
    description: string;
  }>,
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');

  const experience = await prisma.experience.findFirst({
    where: { id: experienceId, careerProfileId: profile.id },
  });
  if (!experience) throw new Error('NOT_FOUND');

  return prisma.experience.update({ where: { id: experienceId }, data });
}

export async function deleteExperience(userId: string, experienceId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');

  const experience = await prisma.experience.findFirst({
    where: { id: experienceId, careerProfileId: profile.id },
  });
  if (!experience) throw new Error('NOT_FOUND');

  return prisma.experience.delete({ where: { id: experienceId } });
}

// ─── Education ────────────────────────────────────────────────────────────────

export async function getEducation(userId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.education.findMany({
    where: { careerProfileId: profile.id },
    orderBy: { startDate: 'desc' },
  });
}

export async function createEducation(
  userId: string,
  data: {
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent?: boolean;
    grade?: string;
    description?: string;
  },
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  return prisma.education.create({
    data: { careerProfileId: profile.id, ...data },
  });
}

export async function updateEducation(
  userId: string,
  educationId: string,
  data: object,
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const edu = await prisma.education.findFirst({
    where: { id: educationId, careerProfileId: profile.id },
  });
  if (!edu) throw new Error('NOT_FOUND');
  return prisma.education.update({ where: { id: educationId }, data });
}

export async function deleteEducation(userId: string, educationId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const edu = await prisma.education.findFirst({
    where: { id: educationId, careerProfileId: profile.id },
  });
  if (!edu) throw new Error('NOT_FOUND');
  return prisma.education.delete({ where: { id: educationId } });
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(userId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.project.findMany({
    where: { careerProfileId: profile.id },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProject(
  userId: string,
  data: {
    name: string;
    description?: string;
    technologies?: string[];
    projectUrl?: string;
    repoUrl?: string;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  return prisma.project.create({
    data: { careerProfileId: profile.id, ...data },
  });
}

export async function updateProject(
  userId: string,
  projectId: string,
  data: object,
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const proj = await prisma.project.findFirst({
    where: { id: projectId, careerProfileId: profile.id },
  });
  if (!proj) throw new Error('NOT_FOUND');
  return prisma.project.update({ where: { id: projectId }, data });
}

export async function deleteProject(userId: string, projectId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const proj = await prisma.project.findFirst({
    where: { id: projectId, careerProfileId: profile.id },
  });
  if (!proj) throw new Error('NOT_FOUND');
  return prisma.project.delete({ where: { id: projectId } });
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export async function getSkills(userId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.skill.findMany({
    where: { careerProfileId: profile.id },
    orderBy: { name: 'asc' },
  });
}

export async function createSkill(
  userId: string,
  data: { name: string; category?: string; proficiency?: string },
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  return prisma.skill.create({
    data: { careerProfileId: profile.id, ...data },
  });
}

export async function updateSkill(
  userId: string,
  skillId: string,
  data: object,
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, careerProfileId: profile.id },
  });
  if (!skill) throw new Error('NOT_FOUND');
  return prisma.skill.update({ where: { id: skillId }, data });
}

export async function deleteSkill(userId: string, skillId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, careerProfileId: profile.id },
  });
  if (!skill) throw new Error('NOT_FOUND');
  return prisma.skill.delete({ where: { id: skillId } });
}

// ─── Certifications ───────────────────────────────────────────────────────────

export async function getCertifications(userId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.certification.findMany({
    where: { careerProfileId: profile.id },
    orderBy: { issueDate: 'desc' },
  });
}

export async function createCertification(userId: string, data: object) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  return prisma.certification.create({
    data: { careerProfileId: profile.id, ...(data as any) },
  });
}

export async function updateCertification(
  userId: string,
  certId: string,
  data: object,
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const cert = await prisma.certification.findFirst({
    where: { id: certId, careerProfileId: profile.id },
  });
  if (!cert) throw new Error('NOT_FOUND');
  return prisma.certification.update({ where: { id: certId }, data });
}

export async function deleteCertification(userId: string, certId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const cert = await prisma.certification.findFirst({
    where: { id: certId, careerProfileId: profile.id },
  });
  if (!cert) throw new Error('NOT_FOUND');
  return prisma.certification.delete({ where: { id: certId } });
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function getAchievements(userId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.achievement.findMany({
    where: { careerProfileId: profile.id },
    orderBy: { date: 'desc' },
  });
}

export async function createAchievement(userId: string, data: object) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  return prisma.achievement.create({
    data: { careerProfileId: profile.id, ...(data as any) },
  });
}

export async function updateAchievement(
  userId: string,
  achievementId: string,
  data: object,
) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const ach = await prisma.achievement.findFirst({
    where: { id: achievementId, careerProfileId: profile.id },
  });
  if (!ach) throw new Error('NOT_FOUND');
  return prisma.achievement.update({ where: { id: achievementId }, data });
}

export async function deleteAchievement(userId: string, achievementId: string) {
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const ach = await prisma.achievement.findFirst({
    where: { id: achievementId, careerProfileId: profile.id },
  });
  if (!ach) throw new Error('NOT_FOUND');
  return prisma.achievement.delete({ where: { id: achievementId } });
}

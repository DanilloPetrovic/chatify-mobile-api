// kreiranje statusa
// brisanje
// menjanje
// lajkovanje
// komentarisanje
// prikazivanje
// prikazivanje jednog
// filtriranje

import prisma from "../prisma";

export const createStatus = async (data: {
  content: string;
  userId: number;
}) => {
  const status = await prisma.status.create({
    data: {
      content: data.content,
      user: {
        connect: { id: data.userId },
      },
    },
    include: {
      user: true,
    },
  });

  return status;
};

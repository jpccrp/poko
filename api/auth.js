import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    const user = await prisma.employee.findUnique({
      where: { username: username },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign({ id: user.id, roles: user.roles }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token: token });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}


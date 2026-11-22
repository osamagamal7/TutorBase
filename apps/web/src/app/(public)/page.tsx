import Image from 'next/image';
import { UserSchema } from '@tutorbase/shared';

export default function Home() {
  const googobject = {
    id: '1',
    email: 'myemail@mmm.com',
    name: 'my name',
  };

  const result = UserSchema.safeParse(googobject);
  console.log(result);

  const badobject = {
    id: 1,
    email: 'myemail',
    name: 'my name',
  };

  const result2 = UserSchema.safeParse(badobject);
  console.log(result2);

  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}

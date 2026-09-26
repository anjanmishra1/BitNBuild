export interface DemoExample {
  id: string;
  title: string;
  description: string;
  label: string;
  text: string;
}

export const demoExamples: DemoExample[] = [
  {
    id: 'ai',
    title: 'AI Article',
    description: 'A machine-generated news article with telltale uniform structure.',
    label: 'AI Generated',
    text: `In today's rapidly evolving world, artificial intelligence plays a crucial role in shaping the future of technology. It is important to note that AI has become an integral part of our daily lives, transforming industries and redefining the way we work. The ever-evolving landscape of machine learning continues to push boundaries, fostering a sense of innovation across the globe. In conclusion, AI is at the forefront of a technological revolution that will navigate the complexities of tomorrow with unprecedented precision and care.`,
  },
  {
    id: 'human',
    title: 'Human Article',
    description: 'A first-person blog post with natural variation and personal voice.',
    label: 'Human Written',
    text: `Look, I never thought I'd care about composting. My neighbor Rick — yeah, Rick with the Hawaiian shirts — wouldn't shut up about it for months. So last spring I caved. Bought one of those tumbling bins off Amazon, tossed in some banana peels and dead leaves, and waited. Honestly? It smelled awful for the first week. But then something weird happened. The pile shrank. A lot. By July I had actual dark, crumbly soil. Free fertilizer! My tomatoes went absolutely nuclear that summer — biggest I'd ever grown. Rick gave me that smug "told you so" look and I hated it, but he was right.`,
  },
  {
    id: 'fake',
    title: 'Fake News Example',
    description: 'A fabricated headline-driven post designed to spread misinformation.',
    label: 'Fake News',
    text: `BREAKING: Government officials confirmed today that a massive secret facility has been discovered beneath the city. Sources claim the underground complex spans over 200 acres and contains technology that defies all known scientific principles. Experts say this discovery will change everything we know about the world. In conclusion, it is important to note that this revelation plays a crucial role in understanding the truth that has been hidden from the public for decades. Stay tuned as we delve into the ever-evolving details of this developing story at the forefront of modern journalism.`,
  },
];

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARACTER_ATTRIBUTES,
  calculateAttributeLevel,
  generateCharacterSheet,
} from '../src/lib/gamification/skill-tree';

describe('calculateAttributeLevel', () => {
  it('returns level 1 with 0 XP', () => {
    const result = calculateAttributeLevel(0);
    assert.deepStrictEqual(result, {
      level: 1,
      currentLevelFloorXp: 0,
      nextLevelXp: 100,
    });
  });

  it('clamps negative XP and non-finite inputs to 0', () => {
    assert.deepStrictEqual(calculateAttributeLevel(-50), {
      level: 1,
      currentLevelFloorXp: 0,
      nextLevelXp: 100,
    });
    assert.deepStrictEqual(calculateAttributeLevel(Number.NaN), {
      level: 1,
      currentLevelFloorXp: 0,
      nextLevelXp: 100,
    });
    assert.deepStrictEqual(calculateAttributeLevel(-Infinity), {
      level: 1,
      currentLevelFloorXp: 0,
      nextLevelXp: 100,
    });
  });

  it('remains at level 1 right before 100 XP threshold', () => {
    const result = calculateAttributeLevel(99);
    assert.strictEqual(result.level, 1);
    assert.strictEqual(result.currentLevelFloorXp, 0);
    assert.strictEqual(result.nextLevelXp, 100);
  });

  it('advances to level 2 at exactly 100 XP', () => {
    const result = calculateAttributeLevel(100);
    assert.strictEqual(result.level, 2);
    assert.strictEqual(result.currentLevelFloorXp, 100);
    assert.strictEqual(result.nextLevelXp, 400);
  });

  it('advances to level 3 at exactly 400 XP', () => {
    const result = calculateAttributeLevel(400);
    assert.strictEqual(result.level, 3);
    assert.strictEqual(result.currentLevelFloorXp, 400);
    assert.strictEqual(result.nextLevelXp, 900);
  });

  it('advances to level 4 at exactly 900 XP', () => {
    const result = calculateAttributeLevel(900);
    assert.strictEqual(result.level, 4);
    assert.strictEqual(result.currentLevelFloorXp, 900);
    assert.strictEqual(result.nextLevelXp, 1600);
  });

  it('scales correctly to higher levels', () => {
    const result = calculateAttributeLevel(10000);
    assert.strictEqual(result.level, 11);
    assert.strictEqual(result.currentLevelFloorXp, 10000);
    assert.strictEqual(result.nextLevelXp, 12100);
  });

  it('satisfies strict mathematical monotonicity across sequence', () => {
    let previousLevel = 1;
    let previousFloor = 0;
    for (let xp = 0; xp <= 5000; xp += 25) {
      const res = calculateAttributeLevel(xp);
      assert.ok(res.level >= previousLevel);
      assert.ok(res.currentLevelFloorXp >= previousFloor);
      assert.ok(res.nextLevelXp > res.currentLevelFloorXp);
      assert.ok(xp >= res.currentLevelFloorXp);
      assert.ok(xp < res.nextLevelXp);
      previousLevel = res.level;
      previousFloor = res.currentLevelFloorXp;
    }
  });
});

describe('generateCharacterSheet', () => {
  it('generates a baseline level 1 sheet with 0 XP across all attributes', () => {
    const sheet = generateCharacterSheet({
      strength: 0,
      intellect: 0,
      vitality: 0,
      discipline: 0,
      focus: 0,
      social: 0,
    });

    assert.strictEqual(sheet.overallCharacterLevel, 1);
    assert.strictEqual(sheet.totalXp, 0);
    assert.strictEqual(sheet.imbalanceScore, 0);
    assert.strictEqual(sheet.archetypeTitle, 'The Balanced Master');

    for (const attr of CHARACTER_ATTRIBUTES) {
      const state = sheet.attributes[attr];
      assert.strictEqual(state.attribute, attr);
      assert.strictEqual(state.currentXp, 0);
      assert.strictEqual(state.level, 1);
      assert.strictEqual(state.xpForNextLevel, 100);
      assert.strictEqual(state.levelProgressFraction, 0);
    }
  });

  it('calculates levelProgressFraction accurately', () => {
    const sheet = generateCharacterSheet({
      strength: 50, // 50 / 100 = 0.5
      intellect: 250, // level 2 (floor 100, next 400), progress (250-100)/300 = 0.5
    });

    assert.strictEqual(sheet.attributes.strength.levelProgressFraction, 0.5);
    assert.strictEqual(sheet.attributes.strength.xpForNextLevel, 50);

    assert.strictEqual(sheet.attributes.intellect.level, 2);
    assert.strictEqual(sheet.attributes.intellect.levelProgressFraction, 0.5);
    assert.strictEqual(sheet.attributes.intellect.xpForNextLevel, 150);
  });

  it('maintains perfect balance for uniform XP distribution', () => {
    const sheet = generateCharacterSheet({
      strength: 400,
      intellect: 400,
      vitality: 400,
      discipline: 400,
      focus: 400,
      social: 400,
    });

    assert.strictEqual(sheet.totalXp, 2400);
    assert.strictEqual(sheet.imbalanceScore, 0);
    assert.strictEqual(sheet.archetypeTitle, 'The Balanced Master');
  });

  it('assigns The Scholar when Intellect is 3x higher than all others', () => {
    const sheet = generateCharacterSheet({
      intellect: 900, // level 4
      strength: 0, // level 1
      vitality: 0, // level 1
      discipline: 0, // level 1
      focus: 0, // level 1
      social: 0, // level 1
    });

    assert.strictEqual(sheet.dominantAttribute, 'intellect');
    assert.strictEqual(sheet.lowestAttribute, 'strength');
    assert.ok(sheet.imbalanceScore > 0);
    assert.strictEqual(sheet.archetypeTitle, 'The Scholar');
  });

  it('assigns The Ascetic when Vitality dominates', () => {
    const sheet = generateCharacterSheet({
      vitality: 900, // level 4
      intellect: 0,
      strength: 0,
      discipline: 0,
      focus: 0,
      social: 0,
    });

    assert.strictEqual(sheet.dominantAttribute, 'vitality');
    assert.strictEqual(sheet.archetypeTitle, 'The Ascetic');
  });

  it('assigns The Titan when Strength dominates', () => {
    const sheet = generateCharacterSheet({
      strength: 900,
      intellect: 0,
      vitality: 0,
      discipline: 0,
      focus: 0,
      social: 0,
    });

    assert.strictEqual(sheet.dominantAttribute, 'strength');
    assert.strictEqual(sheet.archetypeTitle, 'The Titan');
  });

  it('assigns The Stoic when Discipline dominates', () => {
    const sheet = generateCharacterSheet({
      discipline: 900,
      intellect: 0,
      vitality: 0,
      strength: 0,
      focus: 0,
      social: 0,
    });

    assert.strictEqual(sheet.dominantAttribute, 'discipline');
    assert.strictEqual(sheet.archetypeTitle, 'The Stoic');
  });

  it('assigns The Specialist when Focus dominates', () => {
    const sheet = generateCharacterSheet({
      focus: 900,
      intellect: 0,
      vitality: 0,
      strength: 0,
      discipline: 0,
      social: 0,
    });

    assert.strictEqual(sheet.dominantAttribute, 'focus');
    assert.strictEqual(sheet.archetypeTitle, 'The Specialist');
  });

  it('assigns The Diplomat when Social dominates', () => {
    const sheet = generateCharacterSheet({
      social: 900,
      intellect: 0,
      vitality: 0,
      strength: 0,
      discipline: 0,
      focus: 0,
    });

    assert.strictEqual(sheet.dominantAttribute, 'social');
    assert.strictEqual(sheet.archetypeTitle, 'The Diplomat');
  });

  it('safely handles negative, non-finite, and missing attribute inputs', () => {
    const sheet = generateCharacterSheet({
      intellect: -200,
      strength: Number.NaN,
      vitality: Infinity,
    });

    assert.strictEqual(sheet.attributes.intellect.currentXp, 0);
    assert.strictEqual(sheet.attributes.intellect.level, 1);
    assert.strictEqual(sheet.attributes.strength.currentXp, 0);
    assert.strictEqual(sheet.attributes.strength.level, 1);
    assert.strictEqual(sheet.attributes.vitality.currentXp, 0);
    assert.strictEqual(sheet.attributes.vitality.level, 1);
    assert.strictEqual(sheet.attributes.social.currentXp, 0);
    assert.strictEqual(sheet.attributes.social.level, 1);
  });
});


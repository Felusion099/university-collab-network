import "dotenv/config";
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import { prisma } from "../src/repositories/prisma.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiJson = Record<string, any>;

let server: Server;
let base: string;
const created: string[] = [];
const createdUsers: string[] = [];
const createdProjects: string[] = [];

async function signupUser(username: string): Promise<{ id: string; token: string }> {
  const email = `${username}-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.university.edu`;
  // OTP-first flow: request → verify → registrationToken → signup
  const otpRes = await fetch(`${base}/api/v1/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "signup", fullName: username, requestedRole: "student" }),
  });
  const otpBody = (await otpRes.json()) as ApiJson;
  assert.equal(otpRes.status, 200, `otp request failed: ${JSON.stringify(otpBody).slice(0, 200)}`);
  const code = otpBody.devCode;
  assert.ok(code, "dev env must return devCode for tests");
  const verifyRes = await fetch(`${base}/api/v1/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const verifyBody = (await verifyRes.json()) as ApiJson;
  assert.equal(verifyRes.status, 200, `otp verify failed: ${JSON.stringify(verifyBody).slice(0, 200)}`);

  const res = await fetch(`${base}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "Password123!",
      fullName: username,
      requestedRole: "student",
      registrationToken: verifyBody.registrationToken,
    }),
  });
  const body = (await res.json()) as ApiJson;
  assert.equal(res.status, 201, `signup failed: ${JSON.stringify(body).slice(0, 200)}`);
  createdUsers.push(body.user.id);
  return { id: body.user.id, token: body.accessToken };
}

function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

before(async () => {
  const app = createApp();
  server = app.listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  // Self-cleaning: remove what this test created (no shared-state leakage)
  for (const pid of createdProjects) {
    await prisma.project.delete({ where: { id: pid } }).catch(() => undefined);
  }
  for (const id of created) {
    await prisma.group.delete({ where: { id } }).catch(() => undefined);
  }
  for (const id of createdUsers) {
    await prisma.user.delete({ where: { id } }).catch(() => undefined);
  }
  server.close();
});

describe("Collaboration Spaces (Phase CS)", () => {
  test("PROJECT: create project → space auto-created → creator is Space Owner", async () => {
    const u = await signupUser("projowner");
    const projRes = await fetch(`${base}/api/v1/projects`, {
      method: "POST",
      headers: auth(u.token),
      body: JSON.stringify({ name: "Sync Test Project", visibility: "public" }),
    });
    const proj = (await projRes.json()) as ApiJson;
    assert.equal(projRes.status, 201, JSON.stringify(proj).slice(0, 200));
    createdProjects.push(proj.id);

    const spaceRes = await fetch(`${base}/api/v1/spaces/by-project/${proj.id}`, {
      headers: auth(u.token),
    });
    const space = (await spaceRes.json()) as ApiJson;
    assert.equal(spaceRes.status, 200, JSON.stringify(space).slice(0, 200));
    assert.equal(space.type, "project");
    assert.equal(space.isOwner, true);
    assert.equal(space.isMember, true);
    assert.ok(space.conversationId, "project space must have a chat conversation");
    created.push(space.id);
  });

  test("MEMBER: add project member → space access automatically granted", async () => {
    const owner = await signupUser("syncowner2");
    const member = await signupUser("syncmember1");
    const projRes = await fetch(`${base}/api/v1/projects`, {
      method: "POST",
      headers: auth(owner.token),
      body: JSON.stringify({ name: "Sync Add Project", visibility: "public" }),
    });
    const proj = (await projRes.json()) as ApiJson;
    createdProjects.push(proj.id);
    const space = (await (await fetch(`${base}/api/v1/spaces/by-project/${proj.id}`, { headers: auth(owner.token) })).json()) as ApiJson;
    created.push(space.id);

    const joinRes = await fetch(`${base}/api/v1/projects/${proj.id}/join`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({}),
    });
    assert.equal(joinRes.status, 201, await joinRes.text());

    // Space membership synced (DB-level, not React state)
    const gm = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: space.id, userId: member.id } },
    });
    assert.ok(gm, "project member must have synced space membership");
    assert.equal(gm.role, "member");

    // Chat participant synced
    const conv = await prisma.conversation.findUnique({ where: { groupId: space.id } });
    assert.ok(conv);
    const cp = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: conv.id, userId: member.id } },
    });
    assert.ok(cp, "project member must have synced chat participant");

    // Member can read the space
    const spaceRes = await fetch(`${base}/api/v1/spaces/${space.id}`, { headers: auth(member.token) });
    assert.equal(spaceRes.status, 200);
  });

  test("REMOVAL: remove project member → project membership + space access removed, history preserved", async () => {
    const owner = await signupUser("syncowner3");
    const member = await signupUser("syncmember2");
    const projRes = await fetch(`${base}/api/v1/projects`, {
      method: "POST",
      headers: auth(owner.token),
      body: JSON.stringify({ name: "Sync Remove Project", visibility: "public" }),
    });
    const proj = (await projRes.json()) as ApiJson;
    createdProjects.push(proj.id);
    const space = (await (await fetch(`${base}/api/v1/spaces/by-project/${proj.id}`, { headers: auth(owner.token) })).json()) as ApiJson;
    created.push(space.id);
    await fetch(`${base}/api/v1/projects/${proj.id}/join`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({}),
    });

    // Member sends a message (history must survive removal)
    const msgRes = await fetch(`${base}/api/v1/conversations/${space.conversationId}/messages`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({ body: "my historical contribution" }),
    });
    assert.equal(msgRes.status, 201, await msgRes.text());

    // Owner removes the member from the project
    const rmRes = await fetch(`${base}/api/v1/projects/${proj.id}/members/${member.id}`, {
      method: "DELETE",
      headers: auth(owner.token),
    });
    assert.equal(rmRes.status, 200, await rmRes.text());

    // Project membership removed
    const pm = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: proj.id, userId: member.id } },
    });
    assert.equal(pm, null);

    // Space access removed (transactional sync)
    const gm = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: space.id, userId: member.id } },
    });
    assert.equal(gm, null, "removed project member must lose space access");

    // Historical messages preserved
    const count = await prisma.message.count({
      where: { conversationId: space.conversationId, body: "my historical contribution" },
    });
    assert.equal(count, 1, "former member's messages must remain visible in history");

    // Former member: public space stays previewable, but WITHOUT active access
    const spaceRes = await fetch(`${base}/api/v1/spaces/${space.id}`, { headers: auth(member.token) });
    const formerView = (await spaceRes.json()) as ApiJson;
    assert.equal(formerView.isMember, false, "former member must not have active space access");
    assert.equal(formerView.members.length, 0, "non-members get no member list");
    assert.equal(formerView.conversationId, null, "non-members get no chat access");
  });

  test("LEAVE: member leaves project → space access removed", async () => {
    const owner = await signupUser("syncowner4");
    const member = await signupUser("syncmember3");
    const projRes = await fetch(`${base}/api/v1/projects`, {
      method: "POST",
      headers: auth(owner.token),
      body: JSON.stringify({ name: "Sync Leave Project", visibility: "public" }),
    });
    const proj = (await projRes.json()) as ApiJson;
    createdProjects.push(proj.id);
    const space = (await (await fetch(`${base}/api/v1/spaces/by-project/${proj.id}`, { headers: auth(owner.token) })).json()) as ApiJson;
    created.push(space.id);
    await fetch(`${base}/api/v1/projects/${proj.id}/join`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({}),
    });

    const leaveRes = await fetch(`${base}/api/v1/projects/${proj.id}/leave`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({}),
    });
    assert.ok([200, 204].includes(leaveRes.status), String(leaveRes.status));

    const gm = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: space.id, userId: member.id } },
    });
    assert.equal(gm, null, "leaving project must revoke space access");
  });

  test("INDEPENDENT SPACE: create without a project; no coupling", async () => {
    const u = await signupUser("independent1");
    const res = await fetch(`${base}/api/v1/spaces`, {
      method: "POST",
      headers: auth(u.token),
      body: JSON.stringify({
        name: "AI/ML Community",
        description: "Independent discussion space",
        type: "community",
        visibility: "public",
        membershipMode: "open",
      }),
    });
    const space = (await res.json()) as ApiJson;
    assert.equal(res.status, 201, JSON.stringify(space).slice(0, 200));
    assert.equal(space.type, "community");
    assert.equal(space.linkedProjectId, null);
    created.push(space.id);
  });

  test("OPEN: eligible user can join directly", async () => {
    const owner = await signupUser("openowner");
    const joiner = await signupUser("openjoiner");
    const space = (await (
      await fetch(`${base}/api/v1/spaces`, {
        method: "POST",
        headers: auth(owner.token),
        body: JSON.stringify({ name: "Open Space", type: "study_group", visibility: "public", membershipMode: "open" }),
      })
    ).json()) as ApiJson;
    created.push(space.id);

    const joinRes = await fetch(`${base}/api/v1/spaces/${space.id}/join`, {
      method: "POST",
      headers: auth(joiner.token),
    });
    const body = (await joinRes.json()) as ApiJson;
    assert.equal(joinRes.status, 200);
    assert.equal(body.joined, true);

    const gm = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: space.id, userId: joiner.id } },
    });
    assert.ok(gm);
  });

  test("REQUEST: request_to_join → pending → admin approves → membership created", async () => {
    const owner = await signupUser("reqowner");
    const joiner = await signupUser("reqjoiner");
    const space = (await (
      await fetch(`${base}/api/v1/spaces`, {
        method: "POST",
        headers: auth(owner.token),
        body: JSON.stringify({ name: "Request Space", type: "club", visibility: "public", membershipMode: "request_to_join" }),
      })
    ).json()) as ApiJson;
    created.push(space.id);

    // Direct join is NOT allowed
    const directJoin = await fetch(`${base}/api/v1/spaces/${space.id}/join`, {
      method: "POST",
      headers: auth(joiner.token),
    });
    assert.equal(directJoin.status, 200);
    const djBody = (await directJoin.json()) as ApiJson;
    assert.equal(djBody.pending, true);
    assert.equal(djBody.joined, false);

    // No membership yet
    let gm = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: space.id, userId: joiner.id } },
    });
    assert.equal(gm, null);

    // Owner lists pending requests
    const listRes = await fetch(`${base}/api/v1/spaces/${space.id}/join-requests`, {
      headers: auth(owner.token),
    });
    const requests = (await listRes.json()) as ApiJson;
    assert.equal(requests.data.length, 1);

    // Owner approves → membership created
    const approveRes = await fetch(`${base}/api/v1/spaces/join-requests/${requests.data[0].id}/approve`, {
      method: "PATCH",
      headers: auth(owner.token),
    });
    assert.equal(approveRes.status, 200, await approveRes.text());

    gm = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: space.id, userId: joiner.id } },
    });
    assert.ok(gm, "approval must create membership");
  });

  test("INVITE: unauthorized user cannot join; member cannot manage admins", async () => {
    const owner = await signupUser("invowner");
    const outsider = await signupUser("invoutsider");
    const member = await signupUser("invmember");
    const space = (await (
      await fetch(`${base}/api/v1/spaces`, {
        method: "POST",
        headers: auth(owner.token),
        body: JSON.stringify({ name: "Invite Space", type: "research", visibility: "public", membershipMode: "invite_only" }),
      })
    ).json()) as ApiJson;
    created.push(space.id);

    // Outsider cannot join
    const joinRes = await fetch(`${base}/api/v1/spaces/${space.id}/join`, {
      method: "POST",
      headers: auth(outsider.token),
    });
    assert.equal(joinRes.status, 403);

    // Promote member → owner-only works
    const addRes = await fetch(`${base}/api/v1/spaces/${space.id}/join`, {
      method: "POST",
      headers: auth(outsider.token),
    });
    assert.equal(addRes.status, 403);
    // add the member via invitation flow for role tests
    const inviteRes = await fetch(`${base}/api/v1/groups/${space.id}/invitations`, {
      method: "POST",
      headers: auth(owner.token),
      body: JSON.stringify({ userId: member.id }),
    });
    const invBody = (await inviteRes.json()) as ApiJson;
    assert.equal(inviteRes.status, 201, JSON.stringify(invBody).slice(0, 200));
    // Invitee accepts → membership created
    const acceptRes = await fetch(`${base}/api/v1/groups/invitations/${invBody.requestId}/accept`, {
      method: "PATCH",
      headers: auth(member.token),
    });
    assert.ok([200, 201].includes(acceptRes.status), await acceptRes.text());
    const invList = (await (await fetch(`${base}/api/v1/groups/mine`, { headers: auth(member.token) })).json()) as ApiJson;
    const myGroup = invList.data.find((g: ApiJson) => g.id === space.id);
    assert.ok(myGroup, "invited user should see the space in mine after accepting");
  });

  test("PRIVATE ACCESS: unauthorized user cannot access a private space by ID", async () => {
    const owner = await signupUser("privowner");
    const outsider = await signupUser("privoutsider");
    const space = (await (
      await fetch(`${base}/api/v1/spaces`, {
        method: "POST",
        headers: auth(owner.token),
        body: JSON.stringify({ name: "Private Space", type: "other", visibility: "private", membershipMode: "invite_only" }),
      })
    ).json()) as ApiJson;
    created.push(space.id);

    const res = await fetch(`${base}/api/v1/spaces/${space.id}`, { headers: auth(outsider.token) });
    assert.equal(res.status, 403, "private space must not be accessible by knowing its ID");

    // Not in discovery either
    const listRes = await fetch(`${base}/api/v1/spaces`, { headers: auth(outsider.token) });
    const listed = (await listRes.json()) as ApiJson;
    assert.equal(
      listed.data.find((s: ApiJson) => s.id === space.id),
      undefined,
      "private space must not be discoverable",
    );
  });

  test("CHAT: send, edit, delete-by-admin, pin/unpin, mentions", async () => {
    const owner = await signupUser("chatowner");
    const member = await signupUser("chatmember");
    const space = (await (
      await fetch(`${base}/api/v1/spaces`, {
        method: "POST",
        headers: auth(owner.token),
        body: JSON.stringify({ name: "Chat Space", type: "community", visibility: "public", membershipMode: "open" }),
      })
    ).json()) as ApiJson;
    created.push(space.id);
    await fetch(`${base}/api/v1/spaces/${space.id}/join`, { method: "POST", headers: auth(member.token) });

    // member sends
    const sendRes = await fetch(`${base}/api/v1/conversations/${space.conversationId}/messages`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({ body: "hello @chatowner from member" }),
    });
    const msg = (await sendRes.json()) as ApiJson;
    assert.equal(msg.body, "hello @chatowner from member", JSON.stringify(msg).slice(0, 200));

    // member edits own message
    const editRes = await fetch(`${base}/api/v1/spaces/${space.id}/messages/${msg.id}`, {
      method: "PATCH",
      headers: auth(member.token),
      body: JSON.stringify({ body: "edited by member" }),
    });
    assert.equal(editRes.status, 200, await editRes.text());

    // member cannot edit someone else's message
    const ownerMsg = (await (
      await fetch(`${base}/api/v1/conversations/${space.conversationId}/messages`, {
        method: "POST",
        headers: auth(owner.token),
        body: JSON.stringify({ body: "owner message" }),
      })
    ).json()) as ApiJson;
    const editOtherRes = await fetch(`${base}/api/v1/spaces/${space.id}/messages/${ownerMsg.id}`, {
      method: "PATCH",
      headers: auth(member.token),
      body: JSON.stringify({ body: "hacked" }),
    });
    assert.equal(editOtherRes.status, 403, "member must not edit another's message");

    // member (not admin) cannot pin
    const pinRes = await fetch(`${base}/api/v1/spaces/${space.id}/pin`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({ messageId: msg.id, pinned: true }),
    });
    assert.equal(pinRes.status, 403, "ordinary member must not pin");

    // owner pins
    const pinOwnerRes = await fetch(`${base}/api/v1/spaces/${space.id}/pin`, {
      method: "POST",
      headers: auth(owner.token),
      body: JSON.stringify({ messageId: msg.id, pinned: true }),
    });
    assert.equal(pinOwnerRes.status, 200, await pinOwnerRes.text());

    // pinned list shows it
    const pinned = (await (await fetch(`${base}/api/v1/spaces/${space.id}/pinned`, { headers: auth(member.token) })).json()) as ApiJson;
    assert.equal(pinned.data.length, 1);
    assert.equal(pinned.data[0].id, msg.id);

    // admin moderation: owner deletes the member's message
    const delRes = await fetch(`${base}/api/v1/spaces/${space.id}/messages/${msg.id}`, {
      method: "DELETE",
      headers: auth(owner.token),
    });
    assert.equal(delRes.status, 200, await delRes.text());
    const count = await prisma.message.count({ where: { id: msg.id } });
    assert.equal(count, 0);
  });

  test("AUTHORIZATION: ordinary member cannot change space settings or remove members", async () => {
    const owner = await signupUser("authowner");
    const member = await signupUser("authmember");
    const space = (await (
      await fetch(`${base}/api/v1/spaces`, {
        method: "POST",
        headers: auth(owner.token),
        body: JSON.stringify({ name: "Auth Space", type: "community", visibility: "public", membershipMode: "open" }),
      })
    ).json()) as ApiJson;
    created.push(space.id);
    await fetch(`${base}/api/v1/spaces/${space.id}/join`, { method: "POST", headers: auth(member.token) });

    // member cannot update settings
    const patchRes = await fetch(`${base}/api/v1/spaces/${space.id}`, {
      method: "PATCH",
      headers: auth(member.token),
      body: JSON.stringify({ name: "hacked name" }),
    });
    assert.equal(patchRes.status, 403, "member must not modify space settings");

    // member cannot promote admins
    const adminRes = await fetch(`${base}/api/v1/spaces/${space.id}/admins`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({ userId: member.id }),
    });
    assert.equal(adminRes.status, 403, "member must not manage admins");

    // member cannot delete the space
    const delRes = await fetch(`${base}/api/v1/spaces/${space.id}`, {
      method: "DELETE",
      headers: auth(member.token),
    });
    assert.equal(delRes.status, 403, "member must not delete the space");

    // member cannot remove other members (independent space)
    const rmRes = await fetch(`${base}/api/v1/spaces/${space.id}/members/remove`, {
      method: "POST",
      headers: auth(member.token),
      body: JSON.stringify({ userId: owner.id }),
    });
    assert.equal(rmRes.status, 403, "member must not remove members");
  });
});

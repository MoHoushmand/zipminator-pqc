import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/features/mesh/mesh_status_screen.dart';

MeshStatus _fixture() {
  return MeshStatus(
    meshId: 'unit-test-mesh',
    nodeCount: 3,
    activeThreatLevel: 'Normal',
    lastRotationUnixMs: 1714086000000,
    rotationCounter: 7,
    moduleKeysPresent: const [
      'csi_entropy',
      'puek',
      'em_canary',
      'vital_auth',
      'topo_auth',
      'spatiotemporal',
    ],
    nodes: const [
      MeshNode(
        nodeId: 'a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0',
        name: 'aggregator-living-room',
        online: true,
        isCoordinator: true,
        pskEpoch: 7,
        lastBeaconUnixMs: 1714086030000,
      ),
      MeshNode(
        nodeId: 'b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0',
        name: 'esp32-bedroom',
        online: true,
        isCoordinator: false,
        pskEpoch: 7,
        lastBeaconUnixMs: 1714086029500,
      ),
      MeshNode(
        nodeId: 'c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0',
        name: 'esp32-kitchen',
        online: true,
        isCoordinator: false,
        pskEpoch: 7,
        lastBeaconUnixMs: 1714086029800,
      ),
    ],
  );
}

void main() {
  group('MeshStatusScreen', () {
    testWidgets('renders mesh id, node count, threat level, and 6 module keys',
        (tester) async {
      // Tall surface so the entire ListView fits without scrolling.
      tester.view.physicalSize = const Size(1200, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(MaterialApp(
        home: MeshStatusScreen(
          statusLoader: () async => _fixture(),
        ),
      ));
      await tester.pumpAndSettle();

      // Mesh ID and counts.
      expect(find.textContaining('unit-test-mesh'), findsOneWidget);
      expect(find.text('3'), findsWidgets); // node count appears in summary

      // Threat indicator.
      expect(find.text('Normal'), findsOneWidget);

      // All 6 module key chips visible.
      expect(find.text('csi_entropy'), findsOneWidget);
      expect(find.text('puek'), findsOneWidget);
      expect(find.text('em_canary'), findsOneWidget);
      expect(find.text('vital_auth'), findsOneWidget);
      expect(find.text('topo_auth'), findsOneWidget);
      expect(find.text('spatiotemporal'), findsOneWidget);

      // Node tiles.
      expect(find.text('aggregator-living-room'), findsOneWidget);
      expect(find.text('esp32-bedroom'), findsOneWidget);
      expect(find.text('esp32-kitchen'), findsOneWidget);
      // 3 "online" trailing labels.
      expect(find.text('online'), findsNWidgets(3));
    });

    testWidgets('shows error state when loader throws', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: MeshStatusScreen(
          statusLoader: () async => throw StateError('boom'),
        ),
      ));
      await tester.pumpAndSettle();
      expect(find.textContaining('Failed to load mesh status'), findsOneWidget);
    });
  });

  group('MeshStatus.fromJson', () {
    test('parses canonical JSON fixture', () {
      final json = <String, dynamic>{
        'mesh_id': 'm',
        'node_count': 1,
        'active_threat_level': 'High',
        'last_rotation_unix_ms': 100,
        'rotation_counter': 4,
        'module_keys_present': ['csi_entropy'],
        'nodes': [
          {
            'node_id': 'a' * 32,
            'name': 'n',
            'online': true,
            'is_coordinator': false,
            'psk_epoch': 4,
            'last_beacon_unix_ms': 100,
          }
        ],
      };
      final status = MeshStatus.fromJson(json);
      expect(status.meshId, 'm');
      expect(status.nodeCount, 1);
      expect(status.activeThreatLevel, 'High');
      expect(status.rotationCounter, 4);
      expect(status.moduleKeysPresent, ['csi_entropy']);
      expect(status.nodes, hasLength(1));
      expect(status.nodes.first.online, isTrue);
    });
  });
}
